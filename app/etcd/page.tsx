'use client';

import React from 'react';
import { ClusterVisualization } from './components/cluster/ClusterVisualization';

export default function EtcdRaftVisualization() {
  return (
    <div className="bg-primary container mx-auto p-4 space-y-4">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-8">
          <h1 className="text-4xl text-primary font-bold tracking-tight">
            Raft Consensus Algorithm
          </h1>
          <p className="mt-2 text-lg text-secondary">
            Interactive visualization of distributed consensus with leader election and log replication
          </p>
        </header>

        <div className="bg-primary border border-primary rounded-xl p-6">
          <ClusterVisualization />
        </div>
      </div>
    </div>
  );
}
