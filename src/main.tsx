// FIX: Suppress "removeChild" errors from html5-qrcode
const originalRemoveChild = Node.prototype.removeChild;
Node.prototype.removeChild = function (child) {
    try {
        return originalRemoveChild.apply(this, [child]);
    } catch (e: any) {
        if (e.message?.includes("The node to be removed is not a child of this node")) {
            console.warn("Suppressed removeChild error (html5-qrcode fix)");
            return child; // Pretend it succeeded
        }
        throw e;
    }
};

const originalInsertBefore = Node.prototype.insertBefore;
Node.prototype.insertBefore = function (newNode, referenceNode) {
    try {
        return originalInsertBefore.apply(this, [newNode, referenceNode]);
    } catch (e: any) {
        if (e.message?.includes("The node before which the new node is to be inserted is not a child of this node")) {
            console.warn("Suppressed insertBefore error (html5-qrcode fix)");
            return newNode;
        }
        throw e;
    }
};

import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import ErrorBoundary from "./components/ErrorBoundary";


// Basic error handling for pure white screen issues
window.addEventListener('error', (event) => {
    const errorRoot = document.getElementById('root');
    if (errorRoot && errorRoot.innerHTML === '') {
        errorRoot.innerHTML = `
            <div style="padding: 20px; font-family: sans-serif; color: #d32f2f;">
                <h1>Application Failed to Start</h1>
                <p>Error: ${event.message}</p>
                <pre style="background: #f5f5f5; padding: 10px; overflow: auto;">${event.error?.stack || 'No stack trace'}</pre>
            </div>
        `;
    }
});

try {
    const rootElement = document.getElementById("root");
    if (!rootElement) throw new Error("Root element not found");

    createRoot(rootElement).render(
        <ErrorBoundary>
            <App />
        </ErrorBoundary>
    );
} catch (error) {
    console.error("Failed to render app:", error);
    document.body.innerHTML = `
        <div style="padding: 20px; font-family: sans-serif; color: #d32f2f;">
            <h1>Fatal Error</h1>
            <p>Failed to initialize application.</p>
            <pre>${error instanceof Error ? error.message : String(error)}</pre>
        </div>
    `;
}
