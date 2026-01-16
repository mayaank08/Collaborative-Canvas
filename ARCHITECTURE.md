# Architecture Documentation

## 1. Canvas Mastery
We have implemented several techniques to ensure efficient and smooth canvas operations:

-   **Path Optimization**:
    -   We utilize **Quadratic Bézier Curves** to smooth drawing paths. Instead of connecting raw input points with straight lines (which can look jagged), we calculate control points between captured coordinates to render smooth, organic curves.
    -   This logic is encapsulated in `CanvasManager.renderPoints`, ensuring consistent rendering for both local and remote strokes.

-   **Layer Management & Undo/Redo**:
    -   **Dynamic History Stack**: All completed strokes are stored in a history stack (`localHistory`).
    -   **Global Undo/Redo**: When a user triggers undo, the stroke is removed from the global history and pushed to a `redoStack`. This state changes are broadcasted to all clients, who then re-render their local canvas from the updated history.
    -   **Redo Consistency**: Any new drawing action clears the `redoStack` to maintain a linear, consistent history timeline, mimicking standard editor behavior.

-   **Efficient Redrawing**:
    -   Our `redrawAll` strategy clears the canvas and replays the history stack. While simple, this ensures absolute consistency between clients. For future scalability (thousands of strokes), this can be optimized with an offscreen "cache" canvas for settled strokes, redrawing only the active layer.

-   **High-Frequency Handling**:
    -   We capture raw `mousemove` and `touchmove` events rather than throttling them, ensuring no detail is lost during fast sketching.
    -   **Optimization**: Cursor updates are decoupled from the drawing loop. We use `requestAnimationFrame` for cursor rendering (`loopCursors`), ensuring 60fps independent of network traffic.

## 2. Real-time Architecture

-   **Data Serialization**:
    -   Drawing data is serialized as lightweight JSON objects.
    -   **Stroke Structure**:
        ```typescript
        interface Stroke {
            id: string;
            points: { x: number, y: number }[];
            color: string;
            width: number;
        }
        ```
    -   This structure is sufficient to reconstruct any stroke perfectly on any client.

-   **Event Streaming**:
    -   **`start-stroke`**: Broadcasts initial intent, color, and width. Clients prepare a temporary buffer.
    -   **`draw-point`**: Streams individual points as they happen. This allows for "live" drawing where you see the stroke appear as the remote user moves their mouse, rather than waiting for the stroke to finish.
    -   **`end-stroke`**: Finalizes the stroke, moving it from the temporary buffer to the permanent history.

-   **Latency Handling**:
    -   **Optimistic UI**: The local user sees their own drawing immediately without waiting for server confirmation.
    -   **Eventual Consistency**: The server acts as the source of truth for history. If a client reconnects, they receive the full authoritative history.

## 3. State Synchronization

-   **Operation History**:
    -   The server maintains the authoritative `history` array in `DrawingState`.
    -   New connections receive this full history immediately (`socket.emit('history', ...)`).

-   **Conflict Resolution**:
    -   **Server Authority**: The server's order of events depends on the arrival time of socket messages.
    -   **Atomic Undo**: Undo operations target the global stack's last item. In a collaborative environment, "Undo" effectively means "Undo the last global action". While simplistic, this avoids complex dependency graphs and is intuitive for real-time collaboration.

-   **Identity & Room Management**:
    -   `RoomManager` assigns unique identity colors to users upon connection.
    -   This identity is broadcasted (`update-users`), allowing clients to visualize who is effectively "in the room".
