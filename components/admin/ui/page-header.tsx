import type { ReactNode } from "react";

interface PageHeaderProps {
  title:       string;
  description?: string;
  action?:     ReactNode;
}

export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between gap-4 flex-shrink-0">
      <div>
        <h1 className="text-lg font-semibold text-charcoal leading-none">{title}</h1>
        {description && (
          <p className="text-sm text-charcoal/40 mt-1">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
