'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { ClusterVisualization } from './components/cluster/ClusterVisualization';
import { TreeVisualization } from './components/tree/TreeVisualization';
import { WatchDemo } from './components/watch/WatchDemo';
import { LeaseCountdown } from './components/ttl/LeaseCountdown';
import { Info } from 'lucide-react';

type TabKey = 'cluster' | 'tree' | 'watch' | 'ttl';

const TABS: Record<TabKey, { name: string; description: string }> = {
  cluster: {
    name: 'Cluster & Raft',
    description: 'Raft consensus algorithm visualization with leader election and log replication',
  },
  tree: {
    name: 'Key-Value Tree',
    description: 'Hierarchical namespace tree for key-value pairs',
  },
  watch: {
    name: 'Watch API',
    description: 'Real-time key monitoring and change notifications',
  },
  ttl: {
    name: 'TTL & Leases',
    description: 'Time-based key expiration and lease management',
  },
};

export default function EtcdEducationalApp() {
  const [activeTab, setActiveTab] = useState<TabKey>('cluster');
  const [showOverview, setShowOverview] = useState(true);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlTab = (urlParams.get('tab') as TabKey) || 'cluster';
    setActiveTab(urlTab);
  }, []);

  const handleTabChange = (tab: TabKey) => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tab);
    window.history.pushState({}, '', url);
  };

  return (
    <div className="bg-primary container mx-auto p-4 space-y-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl text-primary font-bold tracking-tight">
            etcd Educational Platform
          </h1>
          <p className="mt-2 text-lg text-secondary">
            Interactive visualizations of distributed key-value store concepts
          </p>
        </header>

        <div className="bg-primary flex justify-center mb-8">
          <div className="flex flex-wrap gap-2 rounded-lg p-1 border-primary border-2">
            {(Object.keys(TABS) as TabKey[]).map((tab) => (
              <Button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`px-4 py-2 flex-1 text-sm rounded-md transition-all focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-slate-900
                  ${
                    activeTab === tab
                      ? 'text-white bg-sky-600 shadow-md'
                      : 'hover:bg-slate-700/50'
                  }`}
              >
                {TABS[tab].name}
              </Button>
            ))}
          </div>
        </div>

        {showOverview && (
          <div className="bg-primary border border-sky-500/30 rounded-xl p-6 mb-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <Info className="w-5 h-5 text-sky-400" />
                <h3 className="text-lg font-semibold text-sky-400">Quick Start Guide</h3>
              </div>
              <button
                onClick={() => setShowOverview(false)}
                className="text-sm text-secondary hover:text-primary"
              >
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div className="space-y-2">
                <div className="font-semibold">1. Cluster & Raft</div>
                <div className="text-secondary">Start here to understand distributed consensus and leader election</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">2. Key-Value Tree</div>
                <div className="text-secondary">Learn how etcd organizes data in hierarchical namespaces</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">3. Watch API</div>
                <div className="text-secondary">See how applications react to data changes in real-time</div>
              </div>
              <div className="space-y-2">
                <div className="font-semibold">4. TTL & Leases</div>
                <div className="text-secondary">Explore automatic key expiration for sessions and locks</div>
              </div>
            </div>
          </div>
        )}

        <div className="bg-primary border border-primary rounded-xl p-6">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-semibold text-sky-400">
              {TABS[activeTab].name}
            </h2>
            <p className="mt-1 max-w-3xl mx-auto text-secondary-foreground">
              {TABS[activeTab].description}
            </p>
          </div>

          <div className="w-full">
            {activeTab === 'cluster' && <ClusterVisualization />}
            {activeTab === 'tree' && <TreeVisualization />}
            {activeTab === 'watch' && <WatchDemo />}
            {activeTab === 'ttl' && <LeaseCountdown />}
          </div>
        </div>
      </div>
    </div>
  );
}
