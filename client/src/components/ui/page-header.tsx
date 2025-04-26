import React from "react";

interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <div className="space-y-1">
      <h1 className="text-3xl font-bold tracking-tight text-gradient-primary">
        {title}
      </h1>
      <p className="text-lg text-muted-foreground">
        {description}
      </p>
    </div>
  );
}