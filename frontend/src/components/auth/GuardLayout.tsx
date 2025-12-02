// Shared layout for guard loading states
import React from "react";

export function GuardLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                {children}
            </div>
        </div>
    );
}