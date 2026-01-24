I want to build an **interactive etcd educational app** inside a Next.js project using:

• **React**, **TypeScript**, **Tailwind CSS**, and **shadcn/ui**  
• **React Flow** for node-and-edge diagrams (open-source part of the library)  
• Optional **D3 sub-modules** (e.g., d3-hierarchy or d3-force) only for layout algorithms or layout data — not for direct DOM manipulation inside React components

The app should include the following **interactive etcd visual modules**:

1. **Cluster & Raft Visualization**
   • Show multiple etcd nodes (leaders, followers) as React Flow nodes.  
   • Animated state changes: leader election, node heartbeats, and log replication.  
   • Clicking a node triggers leader failover simulation.  
   • Show arrows for log replication with animated transitions.

2. **Key-Value Namespace Tree**
   • A tree diagram representing the etcd key hierarchy.  
   • Users can add/update/delete keys.  
   • Visual updates reflect the changes instantly.  
   • Use a layout helper (like d3-hierarchy) to compute positions for a neat tree layout.

3. **Watch API Interactive Demo**
   • A control panel where users change a key’s value.  
   • A watch component listens and updates the UI reactively.  
   • Show real-time animation for value changes in the diagram.

4. **TTL/Lease Countdown**
   • Let users assign TTL to keys.  
   • Display a countdown animation.  
   • On expiration, visually remove the key and show an animation for expiration.

Requirements for the code generation:
• Create reusable React components, TypeScript + Tailwind UI.  
• Use React Flow for the diagram canvas, nodes, edges, zoom/pan, and animated edges.  
• Integrate D3 layout algorithms via data helpers (e.g., d3-hierarchy), but **do not rely on D3 to manipulate the DOM directly** — only compute positions and layout data before passing them into React Flow components.  
• Include a basic state management approach (React Context or Zustand) to share etcd state between modules for live updates.  
• Provide example pages in Next.js that render each visualization module.  
• Add UI controls (buttons, panels) using shadcn/ui for triggering simulations (e.g., leader fail, add key).  
• Provide thorough comments explaining the logic and animations.

Generate:
• Project structure (folders + key files)  
• Component code (tsx), hooks, and utility modules  
• Example data and mock backend logic (simulating etcd behavior in browser)  
• Tailwind CSS classes and shadcn/ui usage
