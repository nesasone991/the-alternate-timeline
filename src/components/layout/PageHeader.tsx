import type { ReactNode } from 'react';

type PageHeaderProps = {
  title: string;
  lead?: ReactNode;
  children?: ReactNode;
};

export function PageHeader({ title, lead, children }: PageHeaderProps) {
  return (
    <header className="container-page pt-12 pb-8 sm:pt-16">
      <h1 className="inscription text-[clamp(2rem,6vw,3.75rem)] text-parchment">{title}</h1>
      {lead ? <div className="prose-atlas mt-5 text-parchment-muted">{lead}</div> : null}
      {children}
    </header>
  );
}
