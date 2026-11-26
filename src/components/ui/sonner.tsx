import { Toaster as Sonner, toast, useSonner } from "sonner";
import { createElement, useEffect } from 'react';
import { TranslatedText } from '@/features/language/context';

type ToasterProps = React.ComponentProps<typeof Sonner>;

const Toaster = ({ ...props }: ToasterProps) => {
  const { toasts } = useSonner();
  useEffect(() => {
    for (const item of toasts) {
      if (typeof item.title !== 'string' && typeof item.description !== 'string') continue;
      toast(typeof item.title === 'string' ? createElement(TranslatedText, { source: item.title }) : item.title ?? '', {
        ...item,
        ...(typeof item.description === 'string' ? { description: createElement(TranslatedText, { source: item.description }) } : {}),
      });
    }
  }, [toasts]);
  return (
    <Sonner
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
