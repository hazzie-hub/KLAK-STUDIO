'use client';

import { createContext, useContext, type ReactNode } from 'react';

export type UpdateNodeDataFn = (id: string, patch: Record<string, unknown>) => void;

const WorkflowNodeContext = createContext<UpdateNodeDataFn | null>(null);

export function WorkflowNodeProvider({
  value,
  children,
}: {
  value: UpdateNodeDataFn;
  children: ReactNode;
}) {
  return (
    <WorkflowNodeContext.Provider value={value}>
      {children}
    </WorkflowNodeContext.Provider>
  );
}

export function useUpdateNodeData(): UpdateNodeDataFn {
  const fn = useContext(WorkflowNodeContext);
  if (!fn) {
    throw new Error('useUpdateNodeData must be used inside WorkflowNodeProvider');
  }
  return fn;
}
