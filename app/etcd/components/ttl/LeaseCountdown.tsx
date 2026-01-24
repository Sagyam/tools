'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useEtcdStore } from '../../store/etcdStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { LearningGuide } from '../LearningGuide';
import { HelpTooltip } from '../HelpTooltip';

const LEARNING_STEPS = [
  {
    action: 'Create a key with short TTL (e.g., 10 seconds)',
    learn: 'Lease is created and attached to the key',
  },
  {
    action: 'Watch the progress bar countdown',
    learn: 'Visual feedback shows time remaining until expiration',
  },
  {
    action: 'Wait for expiration or click "Revoke"',
    learn: 'Key automatically deleted when lease expires',
  },
  {
    action: 'Create multiple keys with same TTL',
    learn: 'Multiple keys can share one lease for efficient management',
  },
];

interface LeaseDisplay {
  id: string;
  ttl: number;
  grantedAt: number;
  keys: string[];
  remaining: number;
  progress: number;
}

export const LeaseCountdown: React.FC = () => {
  const { keyValues, leases, put, grantLease, revokeLease } = useEtcdStore();
  const [leaseDisplays, setLeaseDisplays] = useState<LeaseDisplay[]>([]);
  const [newKey, setNewKey] = useState('');
  const [newValue, setNewValue] = useState('');
  const [ttlSeconds, setTtlSeconds] = useState(10);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const displays: LeaseDisplay[] = [];

      leases.forEach((lease) => {
        const elapsed = now - lease.grantedAt;
        const remaining = Math.max(0, lease.ttl * 1000 - elapsed);
        const progress = (remaining / (lease.ttl * 1000)) * 100;

        displays.push({
          id: lease.id,
          ttl: lease.ttl,
          grantedAt: lease.grantedAt,
          keys: lease.keys,
          remaining,
          progress,
        });
      });

      setLeaseDisplays(displays.sort((a, b) => a.remaining - b.remaining));
    }, 100);

    return () => clearInterval(interval);
  }, [leases]);

  const handleCreateKeyWithLease = useCallback(() => {
    if (!newKey || !newValue) return;
    const leaseId = grantLease(ttlSeconds);
    const key = newKey.startsWith('/') ? newKey : `/${newKey}`;
    put(key, newValue, leaseId);
    setNewKey('');
    setNewValue('');
  }, [newKey, newValue, ttlSeconds, grantLease, put]);

  const handleRevokeLease = useCallback(
    (leaseId: string) => {
      revokeLease(leaseId);
    },
    [revokeLease]
  );

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const milliseconds = ms % 1000;
    return `${seconds}.${Math.floor(milliseconds / 100)}s`;
  };

  return (
    <div className="space-y-6">
      <LearningGuide steps={LEARNING_STEPS} />

      <div className="p-4 bg-primary border border-primary-foreground rounded-lg space-y-4">
        <h3 className="font-semibold">Create Key with Lease</h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label htmlFor="lease-key">Key Path</Label>
            <Input
              id="lease-key"
              placeholder="/temp/session"
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKeyWithLease()}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lease-value">Value</Label>
            <Input
              id="lease-value"
              placeholder="value"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateKeyWithLease()}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="ttl">TTL (seconds)</Label>
              <HelpTooltip>
                <div className="space-y-1">
                  <div className="font-semibold">Time-To-Live</div>
                  <div>How long before key expires</div>
                  <div>Try 10s for quick demo</div>
                  <div>Useful for sessions, locks, cache</div>
                </div>
              </HelpTooltip>
            </div>
            <Input
              id="ttl"
              type="number"
              min="1"
              max="60"
              value={ttlSeconds}
              onChange={(e) => setTtlSeconds(parseInt(e.target.value) || 10)}
            />
          </div>
          <div className="space-y-2">
            <Label>&nbsp;</Label>
            <Button
              onClick={handleCreateKeyWithLease}
              className="w-full bg-sky-600 hover:bg-sky-500"
              disabled={!newKey || !newValue}
            >
              Create
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Active Leases ({leaseDisplays.length})</Label>
        </div>

        <div className="space-y-4">
          {leaseDisplays.length === 0 ? (
            <div className="text-center text-secondary py-8 bg-primary border border-primary-foreground rounded-lg">
              No active leases. Create a key with TTL to get started.
            </div>
          ) : (
            leaseDisplays.map((lease) => {
              const isExpiringSoon = lease.remaining < 3000;
              const isExpired = lease.remaining === 0;

              return (
                <div
                  key={lease.id}
                  className={`
                    p-4 rounded-lg border border-primary-foreground transition-all duration-300
                    ${isExpired ? 'opacity-50' : ''}
                    ${isExpiringSoon && !isExpired ? 'animate-pulse' : ''}
                  `}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="space-y-1">
                      <div className="font-mono text-sm font-bold">{lease.id}</div>
                      <div className="text-xs text-secondary">
                        TTL: {lease.ttl}s | Keys: {lease.keys.length}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isExpired ? (
                        <Badge variant="destructive">Expired</Badge>
                      ) : isExpiringSoon ? (
                        <Badge variant="default" className="bg-amber-600">
                          Expiring
                        </Badge>
                      ) : (
                        <Badge variant="default">Active</Badge>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRevokeLease(lease.id)}
                      >
                        Revoke
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-secondary">Time Remaining</span>
                      <span
                        className={`font-mono font-bold ${
                          isExpired
                            ? 'text-red-400'
                            : isExpiringSoon
                            ? 'text-amber-400'
                            : 'text-sky-400'
                        }`}
                      >
                        {formatTime(lease.remaining)}
                      </span>
                    </div>
                    <Progress
                      value={lease.progress}
                      className={`h-3 ${isExpiringSoon ? 'animate-pulse' : ''}`}
                    />
                  </div>

                  {lease.keys.length > 0 && (
                    <div className="mt-3 space-y-1">
                      <div className="text-xs font-semibold text-secondary">
                        Associated Keys:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lease.keys.map((key) => (
                          <Badge
                            key={key}
                            variant="outline"
                            className="text-xs font-mono"
                          >
                            {key}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label>Keys with TTL</Label>
        <div className="max-h-60 overflow-y-auto space-y-1 p-2 bg-primary border border-primary-foreground rounded-lg">
          {Array.from(keyValues.values())
            .filter((kv) => kv.lease)
            .map((kv) => {
              const lease = leases.get(kv.lease!);
              const timeRemaining = lease
                ? Math.max(0, lease.grantedAt + lease.ttl * 1000 - Date.now())
                : 0;

              return (
                <div
                  key={kv.key}
                  className="flex items-center justify-between p-2 bg-primary border border-primary-foreground rounded"
                >
                  <div className="flex-1">
                    <div className="font-mono text-sm font-semibold">{kv.key}</div>
                    <div className="text-xs text-secondary">{kv.value}</div>
                  </div>
                  <div className="text-xs font-mono text-secondary">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              );
            })}
          {Array.from(keyValues.values()).filter((kv) => kv.lease).length === 0 && (
            <div className="text-center text-secondary py-4">
              No keys with TTL
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
