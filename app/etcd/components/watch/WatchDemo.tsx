'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useEtcdStore } from '../../store/etcdStore';
import { WatchEvent } from '../../types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { LearningGuide } from '../LearningGuide';
import { HelpTooltip } from '../HelpTooltip';

const LEARNING_STEPS = [
  {
    action: 'Click "Start Watching" on a key',
    learn: 'Watch API subscribes to changes on that specific key',
  },
  {
    action: 'Update the key with a new value',
    learn: 'PUT event fires immediately - see timestamp and values',
  },
  {
    action: 'Delete the key',
    learn: 'DELETE event fires - shows previous value before deletion',
  },
  {
    action: 'Try watching different keys',
    learn: 'Each watch is independent - useful for reactive applications',
  },
];

export const WatchDemo: React.FC = () => {
  const { keyValues, put, deleteKey, watch } = useEtcdStore();
  const [watchedKey, setWatchedKey] = useState('/config/app/status');
  const [isWatching, setIsWatching] = useState(false);
  const [events, setEvents] = useState<WatchEvent[]>([]);
  const [newValue, setNewValue] = useState('');

  useEffect(() => {
    if (!isWatching || !watchedKey) return;

    const handleEvent = (event: WatchEvent) => {
      setEvents((prev) => [event, ...prev].slice(0, 20));
    };

    const unwatch = watch(watchedKey, handleEvent);
    return () => {
      unwatch();
    };
  }, [isWatching, watchedKey, watch]);

  const handleStartWatch = useCallback(() => {
    setIsWatching(true);
    setEvents([]);
  }, []);

  const handleStopWatch = useCallback(() => {
    setIsWatching(false);
  }, []);

  const handleUpdateKey = useCallback(() => {
    if (!newValue) return;
    put(watchedKey, newValue);
    setNewValue('');
  }, [watchedKey, newValue, put]);

  const handleDeleteKey = useCallback(() => {
    deleteKey(watchedKey);
  }, [watchedKey, deleteKey]);

  const currentValue = keyValues.get(watchedKey);

  return (
    <div className="space-y-6">
      <LearningGuide steps={LEARNING_STEPS} />

      <div className="p-4 bg-primary border border-primary-foreground rounded-lg space-y-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="watch-key">Key to Watch</Label>
            <HelpTooltip>
              <div className="space-y-1">
                <div className="font-semibold">Watch Mechanism</div>
                <div>Subscribe to changes on a specific key</div>
                <div>Events fire instantly when key changes</div>
                <div>Used for reactive updates in apps</div>
              </div>
            </HelpTooltip>
          </div>
          <div className="flex gap-2">
            <Input
              id="watch-key"
              placeholder="/config/app/status"
              value={watchedKey}
              onChange={(e) => setWatchedKey(e.target.value)}
              disabled={isWatching}
            />
            {!isWatching ? (
              <Button
                onClick={handleStartWatch}
                className="bg-sky-600 hover:bg-sky-500"
                disabled={!watchedKey}
              >
                Start Watching
              </Button>
            ) : (
              <Button
                onClick={handleStopWatch}
                variant="outline"
              >
                Stop Watching
              </Button>
            )}
          </div>
        </div>

        <div className="p-4 bg-primary border border-primary-foreground rounded-lg">
          <div className="text-sm text-secondary mb-2">Current Value</div>
          {currentValue ? (
            <div className="space-y-2">
              <div className="font-mono text-lg font-bold text-sky-400">
                {currentValue.value}
              </div>
              <div className="text-xs text-secondary">
                Version: {currentValue.version} | Modified:{' '}
                {new Date(currentValue.modRevision).toLocaleTimeString()}
              </div>
            </div>
          ) : (
            <div className="text-secondary italic">Key does not exist</div>
          )}
        </div>
      </div>

      {isWatching && (
        <div className="p-4 bg-primary border border-primary-foreground rounded-lg space-y-4">
          <h3 className="font-semibold">Trigger Watch Events</h3>

          <div className="space-y-2">
            <Label htmlFor="new-value">New Value</Label>
            <div className="flex gap-2">
              <Input
                id="new-value"
                placeholder="Enter new value..."
                value={newValue}
                onChange={(e) => setNewValue(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleUpdateKey()}
              />
              <Button
                onClick={handleUpdateKey}
                disabled={!newValue}
                className="bg-sky-600 hover:bg-sky-500"
              >
                Update
              </Button>
            </div>
          </div>

          <Button
            onClick={handleDeleteKey}
            variant="outline"
            className="w-full"
            disabled={!currentValue}
          >
            Delete Key
          </Button>
        </div>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Watch Events ({events.length})</Label>
          {events.length > 0 && (
            <Button
              onClick={() => setEvents([])}
              variant="ghost"
              size="sm"
            >
              Clear
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto space-y-2 p-4 bg-primary border border-primary-foreground rounded-lg">
          {events.length === 0 ? (
            <div className="text-center text-secondary py-8">
              {isWatching
                ? 'Waiting for events... Try updating or deleting the key above.'
                : 'Start watching a key to see events here.'}
            </div>
          ) : (
            events.map((event, index) => (
              <div
                key={`${event.timestamp}-${index}`}
                className="p-4 rounded-lg border border-primary-foreground"
              >
                <div className="flex items-start justify-between mb-2">
                  <Badge
                    variant={event.type === 'PUT' ? 'default' : 'destructive'}
                    className="text-xs"
                  >
                    {event.type}
                  </Badge>
                  <span className="text-xs text-secondary">
                    {new Date(event.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-sm">
                  <div className="text-secondary">
                    Key: <span className="font-bold text-primary">{event.key}</span>
                  </div>
                  {event.type === 'PUT' && event.value && (
                    <div className="text-secondary">
                      Value:{' '}
                      <span className="font-bold text-sky-400">{event.value}</span>
                    </div>
                  )}
                  {event.prevValue && (
                    <div className="text-secondary">
                      Previous:{' '}
                      <span className="font-bold text-secondary">{event.prevValue}</span>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
