import type { ReactNode } from "react";

interface PageHeaderProps {
    eyebrow: string;
    title: string;
    description: string;
    action?:ReactNode;
  }
  
  export function PageHeader({
    eyebrow,
    title,
    description,
    action,
  }: PageHeaderProps) {
    return (
      <div className="mb-8 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
        <div>
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.23em] text-amber-400">
            {eyebrow}
          </p>
  
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h2>
  
          <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-500">
            {description}
          </p>
        </div>
  
        {action && <div className="shrink-0">{action}</div>}
      </div>
    );
  }
  