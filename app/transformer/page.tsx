'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowDown } from 'lucide-react'
import React, { useState } from 'react'

interface TokenizerInterface {
    vocab: Set<string>
    tokenize(text: string): string[]
}

interface SentimentAnalysis {
    tokens: string[]
    sentiment: 'positive' | 'negative' | 'neutral'
    confidence: number
    attentionWeights: number[][]
    logits: number[]
}

interface Matrix {
    [index: number]: number[]
}

interface Embeddings {
    [word: string]: number[]
}

class Tokenizer implements TokenizerInterface {
    constructor() {
        this.vocab = new Set([
            'good',
            'great',
            'awesome',
            'love',
            'excellent',
            'fantastic',
            'amazing',
            'perfect',
            'wonderful',
            'bad',
            'terrible',
            'horrible',
            'hate',
            'poor',
            'disappointing',
            'boring',
            'worst',
            'very',
            'really',
            'absolutely',
            'not',
            'movie',
            'product',
            'service',
            'quality',
            'the',
            'a',
            'an',
            'is',
            'was',
            'am',
            'are',
            'and',
            'but',
            'or',
            'in',
            'on',
            'at',
            'this',
            'that',
            'these',
            'those',
            'it',
            'they',
            'we',
            'i',
            'you',
            'he',
            'she',
        ])
    }

    tokenize(text: string): string[] {
        return text
            .toLowerCase()
            .replace(/[.,!?]/g, '')
            .split(/\s+/)
            .filter((word: string) => this.vocab.has(word))
    }

    vocab: Set<string>
}

class SentimentTransformer {
    private readonly dimModel: number
    private readonly numHeads: number
    private readonly headDim: number
    private readonly tokenizer: TokenizerInterface
    private readonly WQ: Matrix
    private readonly WK: Matrix
    private readonly WV: Matrix
    private readonly WO: Matrix
    private readonly embeddings: Embeddings

    constructor(dimModel: number = 64, numHeads: number = 4) {
        this.dimModel = dimModel
        this.numHeads = numHeads
        this.headDim = dimModel / numHeads
        this.tokenizer = new Tokenizer()

        this.WQ = this.initializeMatrix(dimModel, dimModel)
        this.WK = this.initializeMatrix(dimModel, dimModel)
        this.WV = this.initializeMatrix(dimModel, dimModel)
        this.WO = this.initializeMatrix(dimModel, 3)
        this.embeddings = this.initializeEmbeddings()
    }

    analyze(text: string): SentimentAnalysis {
        const tokens = this.tokenizer.tokenize(text)
        if (tokens.length === 0) {
            return {
                sentiment: 'neutral',
                confidence: 0.5,
                tokens: [],
                attentionWeights: [],
                logits: [0.33, 0.34, 0.33],
            }
        }

        const embeddings = tokens.map(
            (token) =>
                this.embeddings[token] || this.initializeVector(this.dimModel)
        )

        const Q = this.matmul(embeddings, this.WQ)
        const K = this.matmul(embeddings, this.WK)
        const V = this.matmul(embeddings, this.WV)

        const attentionScores = Array(tokens.length)
            .fill(null)
            .map(() => Array(tokens.length).fill(0))

        for (let i = 0; i < tokens.length; i++) {
            for (let j = 0; j < tokens.length; j++) {
                let score = 0
                for (let k = 0; k < this.dimModel; k++) {
                    score += Q[i][k] * K[j][k]
                }
                attentionScores[i][j] = score / Math.sqrt(this.dimModel)
            }
        }

        const attentionWeights = attentionScores.map((row) => this.softmax(row))
        const attentionOutput = this.matmul(attentionWeights, V)

        const pooled = Array(this.dimModel).fill(0)
        for (let i = 0; i < attentionOutput.length; i++) {
            for (let j = 0; j < this.dimModel; j++) {
                pooled[j] += attentionOutput[i][j] / attentionOutput.length
            }
        }

        const logits = Array(3).fill(0)
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < this.dimModel; j++) {
                logits[i] += pooled[j] * this.WO[j][i]
            }
        }

        const probs = this.softmax(logits)
        const sentimentIndex = probs.indexOf(Math.max(...probs))
        const sentiment = ['negative', 'neutral', 'positive'][
            sentimentIndex
        ] as 'negative' | 'neutral' | 'positive'

        return {
            tokens,
            sentiment,
            confidence: Math.max(...probs),
            attentionWeights,
            logits: probs,
        }
    }

    private initializeMatrix(rows: number, cols: number): Matrix {
        const limit = Math.sqrt(6 / (rows + cols))
        return Array(rows)
            .fill(null)
            .map(() =>
                Array(cols)
                    .fill(null)
                    .map(() => Math.random() * 2 * limit - limit)
            )
    }

    private initializeVector(size: number): number[] {
        return Array(size)
            .fill(null)
            .map(() => (Math.random() - 0.5) * 0.1)
    }

    private initializeEmbeddings(): Embeddings {
        const embeddings: Embeddings = {}
        const positiveWords = [
            'good',
            'great',
            'awesome',
            'love',
            'excellent',
            'fantastic',
            'amazing',
            'perfect',
            'wonderful',
        ]
        const negativeWords = [
            'bad',
            'terrible',
            'horrible',
            'hate',
            'poor',
            'disappointing',
            'boring',
            'worst',
        ]

        this.tokenizer.vocab.forEach((word) => {
            const embedding = this.initializeVector(this.dimModel)

            if (positiveWords.includes(word)) {
                embedding[0] = 0.8 + Math.random() * 0.2
            } else if (negativeWords.includes(word)) {
                embedding[0] = -0.8 - Math.random() * 0.2
            }

            embeddings[word] = embedding
        })

        return embeddings
    }

    private matmul(a: Matrix, b: Matrix): Matrix {
        const result = Array(a.length)
            .fill(null)
            .map(() => Array(b[0].length).fill(0))
        for (let i = 0; i < a.length; i++) {
            for (let j = 0; j < b[0].length; j++) {
                for (let k = 0; k < b.length; k++) {
                    result[i][j] += a[i][k] * b[k][j]
                }
            }
        }
        return result
    }

    private softmax(arr: number[]): number[] {
        const expValues = arr.map(Math.exp)
        const sumExp = expValues.reduce((a, b) => a + b, 0)
        return expValues.map((exp) => exp / sumExp)
    }
}

type TransformerVisualizerProps = object

const TransformerVisualizer: React.FC<TransformerVisualizerProps> = () => {
    const [inputText, setInputText] = useState<string>(
        'I really loved this movie! The acting was fantastic and the story was amazing.'
    )
    const [activeToken, setActiveToken] = useState<number | null>(null)

    const transformer = new SentimentTransformer()
    const analysis = transformer.analyze(inputText)

    const getColorForSentiment = (
        sentiment: 'positive' | 'negative' | 'neutral',
        confidence: number
    ): string => {
        switch (sentiment) {
            case 'positive':
                return `rgba(34, 197, 94, ${confidence})`
            case 'negative':
                return `rgba(239, 68, 68, ${confidence})`
            default:
                return `rgba(156, 163, 175, ${confidence})`
        }
    }

    return (
        <div className="w-full max-w-6xl p-4">
            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Sentiment Analysis Transformer</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="mb-6">
                        <textarea
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            className="w-full p-2 border rounded"
                            rows={4}
                        />
                    </div>

                    <div
                        className="mb-6 p-4 rounded"
                        style={{
                            backgroundColor: getColorForSentiment(
                                analysis.sentiment,
                                0.2
                            ),
                        }}
                    >
                        <div className="text-lg font-bold mb-2">
                            Sentiment:{' '}
                            {analysis.sentiment.charAt(0).toUpperCase() +
                                analysis.sentiment.slice(1)}
                        </div>
                        <div className="text-sm">
                            Confidence: {(analysis.confidence * 100).toFixed(1)}
                            %
                        </div>
                    </div>

                    {analysis.tokens.length > 0 && (
                        <div className="space-y-8">
                            <div className="flex flex-col items-center">
                                <div className="text-lg font-semibold mb-2">
                                    Analyzed Tokens
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {analysis.tokens.map(
                                        (token: string, idx: number) => (
                                            <div
                                                key={idx}
                                                className={`p-2 rounded cursor-pointer transition-all duration-300 ${
                                                    activeToken === idx
                                                        ? 'bg-blue-500 text-white'
                                                        : 'bg-gray-100 hover:bg-gray-200'
                                                }`}
                                                onClick={() =>
                                                    setActiveToken(
                                                        idx === activeToken
                                                            ? null
                                                            : idx
                                                    )
                                                }
                                            >
                                                {token}
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            <div className="flex justify-center">
                                <ArrowDown className="w-6 h-6 text-gray-400" />
                            </div>

                            <div className="flex flex-col items-center">
                                <div className="text-lg font-semibold mb-2">
                                    Attention Matrix
                                </div>
                                <div className="overflow-x-auto w-full">
                                    <div
                                        className="grid"
                                        style={{
                                            gridTemplateColumns: `repeat(${analysis.tokens.length}, minmax(40px, 1fr))`,
                                            gap: '2px',
                                        }}
                                    >
                                        {analysis.attentionWeights.map(
                                            (row: number[], i: number) =>
                                                row.map(
                                                    (
                                                        weight: number,
                                                        j: number
                                                    ) => (
                                                        <div
                                                            key={`${i}-${j}`}
                                                            className="h-10 flex items-center justify-center text-xs"
                                                            style={{
                                                                backgroundColor: `rgba(59, 130, 246, ${
                                                                    activeToken ===
                                                                    null
                                                                        ? weight
                                                                        : i ===
                                                                            activeToken
                                                                          ? weight
                                                                          : 0.1
                                                                })`,
                                                                color:
                                                                    weight > 0.5
                                                                        ? 'white'
                                                                        : 'black',
                                                            }}
                                                        >
                                                            {weight.toFixed(2)}
                                                        </div>
                                                    )
                                                )
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardContent className="mt-4">
                    <div className="space-y-4">
                        <p className="text-gray-600">Features:</p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Enter any text to analyze its sentiment</li>
                            <li>
                                Click on tokens to see their attention patterns
                            </li>
                            <li>
                                View the full attention matrix showing word
                                relationships
                            </li>
                            <li>
                                See confidence scores and sentiment
                                classification
                            </li>
                        </ul>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default TransformerVisualizer
