import os
import sys
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak
)
from reportlab.pdfgen import canvas

class NumberedCanvas(canvas.Canvas):
    """
    Two-pass canvas for dynamic total page count, running header, and footer.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_decorations(num_pages)
            super().showPage()
        super().save()

    def draw_page_decorations(self, page_count):
        self.saveState()
        
        # Running Header (pages 2+)
        if self._pageNumber > 1:
            self.setFont("Helvetica-Bold", 7.5)
            self.setFillColor(colors.HexColor("#334155"))
            self.drawString(36, 760, "AETHERDOC — TECHNICAL PROJECT DOSSIER & RESUME GUIDE")
            self.setFont("Helvetica", 7.5)
            self.setFillColor(colors.HexColor("#64748B"))
            self.drawRightString(576, 760, "GOOGLE L5+ / STAFF FULL-STACK & DISTRIBUTED SYSTEMS")
            self.setStrokeColor(colors.HexColor("#CBD5E1"))
            self.setLineWidth(0.6)
            self.line(36, 754, 576, 754)
        
        # Running Footer (all pages)
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor("#64748B"))
        self.setStrokeColor(colors.HexColor("#CBD5E1"))
        self.setLineWidth(0.6)
        self.line(36, 28, 576, 28)
        
        self.drawString(36, 16, "Confidential Candidate Portfolio — Optimized for FAANG / Tier-1 Software Engineering Resumes")
        page_str = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(576, 16, page_str)
        
        self.restoreState()


def build_pdf(filename):
    doc = SimpleDocTemplate(
        filename,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=38,
        bottomMargin=34
    )

    # Color Palette
    c_primary = colors.HexColor("#0F172A")    # Slate 900
    c_accent = colors.HexColor("#2563EB")     # Blue 600
    c_indigo = colors.HexColor("#4F46E5")     # Indigo 600
    c_body = colors.HexColor("#334155")       # Slate 700
    c_bg_light = colors.HexColor("#F8FAFC")   # Slate 50
    c_border = colors.HexColor("#CBD5E1")     # Slate 300
    c_code_bg = colors.HexColor("#F1F5F9")    # Slate 100
    c_header_bg = colors.HexColor("#EEF2F6")  # Slate 150

    # Typography Styles
    title_style = ParagraphStyle(
        'DocTitle',
        fontName='Helvetica-Bold',
        fontSize=15,
        leading=18,
        textColor=c_primary,
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=c_accent,
        spaceAfter=6
    )

    h1_style = ParagraphStyle(
        'SectionH1',
        fontName='Helvetica-Bold',
        fontSize=10.5,
        leading=13.5,
        textColor=c_primary,
        spaceBefore=6,
        spaceAfter=4
    )

    h2_style = ParagraphStyle(
        'SectionH2',
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11.5,
        textColor=c_indigo,
        spaceBefore=5,
        spaceAfter=2.5
    )

    body_style = ParagraphStyle(
        'BodyDark',
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=c_body,
        spaceAfter=2.5
    )

    body_bold = ParagraphStyle(
        'BodyBold',
        parent=body_style,
        fontName='Helvetica-Bold'
    )

    bullet_style = ParagraphStyle(
        'BulletText',
        fontName='Helvetica',
        fontSize=7.8,
        leading=10.5,
        textColor=c_body,
        leftIndent=10,
        firstLineIndent=-7,
        spaceAfter=2.5
    )

    prompt_style = ParagraphStyle(
        'PromptBoxText',
        fontName='Courier',
        fontSize=7,
        leading=9.2,
        textColor=c_primary
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=c_primary
    )

    meta_val = ParagraphStyle(
        'MetaVal',
        fontName='Helvetica',
        fontSize=7.5,
        leading=9.5,
        textColor=c_body
    )

    story_header = ParagraphStyle(
        'StoryHeader',
        fontName='Helvetica-Bold',
        fontSize=8.5,
        leading=11,
        textColor=c_indigo
    )

    story_body = ParagraphStyle(
        'StoryBody',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=c_body
    )

    q_title = ParagraphStyle(
        'QTitle',
        fontName='Helvetica-Bold',
        fontSize=8,
        leading=10.5,
        textColor=c_indigo
    )

    q_ans = ParagraphStyle(
        'QAns',
        fontName='Helvetica',
        fontSize=7.5,
        leading=10,
        textColor=c_body
    )

    elements = []

    # =========================================================================
    # PAGE 1: EXECUTIVE IDENTITY, METRICS & FULL-STACK RESUME BULLETS
    # =========================================================================
    elements.append(Paragraph("AETHERDOC — DISTRIBUTED REAL-TIME DOCUMENT & CANVAS SUITE", title_style))
    elements.append(Paragraph("Comprehensive Technical Project Dossier & Executive Resume Guide | Google L5+ Engineering Standards", subtitle_style))
    
    meta_data = [
        [
            Paragraph("Target Role Profile:", meta_label),
            Paragraph("Senior Full-Stack Engineer / Distributed Systems Architect / Real-Time Concurrency Specialist", meta_val),
            Paragraph("System Scale:", meta_label),
            Paragraph("Sub-20ms P99 Sync Latency | Multi-Tenant Real-Time Room Engine", meta_val)
        ],
        [
            Paragraph("Core Architecture:", meta_label),
            Paragraph("Decentralized Yjs CRDT (YATA Algorithm) + TipTap v3 (ProseMirror AST) + Excalidraw Vector Canvas", meta_val),
            Paragraph("Cloud Topology:", meta_label),
            Paragraph("Vercel Edge CDN + Render ASGI (FastAPI/Uvicorn) + Neon Serverless PostgreSQL", meta_val)
        ],
        [
            Paragraph("Live Frontend Demo:", meta_label),
            Paragraph("<b>https://collaborative-document-editor-delta.vercel.app</b>", meta_val),
            Paragraph("Source Repository:", meta_label),
            Paragraph("<b>github.com/codeprice141/collaborative-document-editor</b>", meta_val)
        ],
        [
            Paragraph("Full Technology Stack:", meta_label),
            Paragraph("React 18, TipTap v3, Yjs, Excalidraw, Tailwind CSS, FastAPI, WebSockets, Python 3.10, Neon Postgres, Docker", meta_val),
            Paragraph("Security & RBAC:", meta_label),
            Paragraph("JWT HS256, OAuth2 (Google/GitHub), Owner/Editor/Viewer Access Control, XSS AST Sanitizer", meta_val)
        ]
    ]
    meta_table = Table(meta_data, colWidths=[95, 195, 75, 175])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 5),
    ]))
    elements.append(meta_table)
    elements.append(Spacer(1, 4))

    # Metrics Table
    elements.append(Paragraph("1. Executive Impact & Quantitative Engineering Metrics (Google XYZ Format)", h1_style))
    metrics_data = [
        [
            Paragraph("<b>Metric Dimension</b>", meta_label),
            Paragraph("<b>Before / Baseline</b>", meta_label),
            Paragraph("<b>Engineering Innovation & Optimization</b>", meta_label),
            Paragraph("<b>Measured Production Impact</b>", meta_label)
        ],
        [
            Paragraph("<b>Real-Time Concurrency</b>", meta_label),
            Paragraph("Full-string HTML overwrite; frequent race conditions & data loss", body_style),
            Paragraph("Integrated Yjs CRDT (YATA Algorithm) with atomic binary update frames", body_style),
            Paragraph("<b>100% Convergence (SEC)</b><br/>Zero data loss; 15-25ms sync", body_style)
        ],
        [
            Paragraph("<b>Initial Bundle Size</b>", meta_label),
            Paragraph("2.45 MB monolithic bundle with Excalidraw vector engine", body_style),
            Paragraph("Dynamic code-splitting via React.lazy and Suspense boundaries", body_style),
            Paragraph("<b>-62% Bundle Size</b><br/>Reduced to 800 KB initial chunk", body_style)
        ],
        [
            Paragraph("<b>First Contentful Paint</b>", meta_label),
            Paragraph("4.2s on mobile 4G network due to heavy initial canvas scripts", body_style),
            Paragraph("Tree-shaking, lazy chunking, and Tailwind CSS design token compilation", body_style),
            Paragraph("<b>73% Speedup (1.1s FCP)</b><br/>Core Web Vitals grade A", body_style)
        ],
        [
            Paragraph("<b>Auth Reload Latency</b>", meta_label),
            Paragraph("45-60s freeze on 'Loading AetherDoc...' during container cold starts", body_style),
            Paragraph("Optimistic Session Hydration from localStorage + non-blocking SWR check", body_style),
            Paragraph("<b>0ms Instant Render</b><br/>Eliminated 100% of reload freezes", body_style)
        ],
        [
            Paragraph("<b>Connection Lifecycle</b>", meta_label),
            Paragraph("Ghost users permanently lingered in room after dirty tab closes", body_style),
            Paragraph("Ping-pong heartbeat touch (25s), 45s stale reaper, & multi-tab deduplication", body_style),
            Paragraph("<b>100% Presence Accuracy</b><br/>Zero phantom collaborator count", body_style)
        ],
        [
            Paragraph("<b>Database Contention</b>", meta_label),
            Paragraph("Database write collapse under bursts of 50 concurrent typists", body_style),
            Paragraph("In-memory Write-Behind Buffer with 2s idle / 5s sliding window async flush", body_style),
            Paragraph("<b>95% DB Write Reduction</b><br/>Sustained 1,000+ ops/sec", body_style)
        ]
    ]
    metrics_table = Table(metrics_data, colWidths=[95, 125, 200, 120])
    metrics_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_header_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 1.8),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 1.8),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
    ]))
    elements.append(metrics_table)
    elements.append(Spacer(1, 4))

    # Resume Bullets Part 1 (Full-Stack Core)
    elements.append(Paragraph("2. Targeted FAANG-Ready Resume Bullet Points — Full-Stack Core", h1_style))
    elements.append(Paragraph("• <b>Architected a real-time collaborative workspace</b> unifying rich-text prose (TipTap/ProseMirror) and vector illustration (Excalidraw) into an integrated room engine, eliminating tool-switching overhead for cross-functional engineering teams.", bullet_style))
    elements.append(Paragraph("• <b>Engineered a conflict-free synchronization pipeline</b> using Yjs CRDT and binary WebSocket frames (lib0), achieving Strong Eventual Consistency (SEC) and sub-20ms multi-user convergence across distributed browser sessions.", bullet_style))
    elements.append(Paragraph("• <b>Eliminated 60-second cloud cold-start UI freezes</b> by architecting an optimistic stale-while-revalidate authentication hydration engine, delivering instant 0ms dashboard/editor renders during backend container spin-up cycles.", bullet_style))
    elements.append(Paragraph("• <b>Reduced initial client bundle size by 62% (1.8 MB saved)</b> and accelerated First Contentful Paint from 4.2s to 1.1s by designing a dynamic code-splitting and lazy-loading architecture for complex vector graphics engines.", bullet_style))
    elements.append(Paragraph("• <b>Engineered a robust WebSocket presence lifecycle</b> featuring 25s ping-pong heartbeats, 45s stale socket reaping, and multi-tab user deduplication, completely eliminating phantom collaborator counts.", bullet_style))
    elements.append(Paragraph("• <b>Designed an asynchronous Write-Behind Buffer</b> that decoupled real-time keystrokes from PostgreSQL persistence, buffering 1,000+ updates/sec in-memory with debounced disk flushing to protect connection pools.", bullet_style))

    # Exact Page Break to Page 2
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 2: SPECIALIZED BULLETS & CONCURRENCY / SUBSYSTEM ARCHITECTURE
    # =========================================================================
    elements.append(Paragraph("2. Targeted Resume Bullets — Distributed Systems & Frontend Focus", h1_style))
    elements.append(Paragraph("A. Distributed Systems & Backend Engineering Focus", h2_style))
    elements.append(Paragraph("• <b>Designed and deployed an asynchronous distributed WebSocket server</b> in FastAPI and Python 3.10, managing concurrent room channels, binary delta routing, and inverted-index presence registries across multi-tenant rooms.", bullet_style))
    elements.append(Paragraph("• <b>Implemented mathematical tie-breaking via the YATA CRDT algorithm</b>, leveraging immutable origin references and client-clock tuples to guarantee total ordering and convergence without central sequencing servers.", bullet_style))
    elements.append(Paragraph("• <b>Constructed high-throughput persistence pipelines</b> using Neon Serverless PostgreSQL with PgBouncer connection pooling and SQLAlchemy 2.0 asyncpg, implementing atomic document revision snapshots and rollback endpoints.", bullet_style))

    elements.append(Paragraph("B. Frontend, UI Architecture & Web Performance Focus", h2_style))
    elements.append(Paragraph("• <b>Replaced fragile browser contenteditable/execCommand implementations</b> with a structured ProseMirror AST pipeline (TipTap v3), solving cursor jump anomalies and enabling complex inline marks, tables, and task lists.", bullet_style))
    elements.append(Paragraph("• <b>Implemented smooth real-time collaborative cursors and selection highlights</b> via the Ephemeral Awareness Protocol, throttling mouse movements to 30 FPS and mapping relative character offsets across viewports.", bullet_style))
    elements.append(Paragraph("• <b>Built a responsive, enterprise-grade design system</b> using Tailwind CSS, featuring balanced dark/light theme switching, floating selection capsule menus, mobile bottom drawers, and accessible micro-interactions.", bullet_style))

    elements.append(Paragraph("3. Deep Technical Architecture & Algorithmic Foundations", h1_style))
    elements.append(Paragraph("Why CRDT (Yjs / YATA) was Chosen Over Operational Transformation (OT):", h2_style))
    elements.append(Paragraph("Traditional collaborative editors (e.g., Google Docs, Etherpad) rely on Operational Transformation (OT). While OT minimizes raw over-the-wire payload size, it enforces severe architectural bottlenecks: (1) it strictly requires an authoritative central sequencing server to establish global operation order; (2) multi-way transformations must satisfy the mathematically complex TP2 condition; and (3) merging long offline branches requires expensive historical log playback that causes server lockups. In contrast, <b>CRDTs guarantee Strong Eventual Consistency (SEC)</b>: any two replicas that receive the same updates converge to the exact same state, regardless of arrival order.", body_style))

    crdt_flow = [
        [
            Paragraph("<b>Algorithmic Property</b>", meta_label),
            Paragraph("<b>Operational Transformation (OT)</b>", meta_label),
            Paragraph("<b>AetherDoc Yjs CRDT (YATA Algorithm)</b>", meta_label)
        ],
        [
            Paragraph("<b>Convergence Principle</b>", body_bold),
            Paragraph("Central server transforms indices: T(op1, op2) -> (op1', op2')", body_style),
            Paragraph("Commutative join-semilattice: Item doubly-linked list with immutable originLeft/originRight and deterministic client ID tie-breaking.", body_style)
        ],
        [
            Paragraph("<b>Offline Synchronization</b>", body_bold),
            Paragraph("Heavy transformation against historical server logs; prone to drift.", body_style),
            Paragraph("2-Step State Vector handshake: client sends SV, server diffs and sends missing binary delta. 100% convergence with zero drift.", body_style)
        ],
        [
            Paragraph("<b>Tombstone / Memory</b>", body_bold),
            Paragraph("No tombstones; characters are deleted immediately.", body_style),
            Paragraph("Deleted characters marked as tombstones in run-length DeleteSets; squashed to fresh snapshot roots on revision milestones.", body_style)
        ]
    ]
    crdt_table = Table(crdt_flow, colWidths=[110, 195, 235])
    crdt_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_header_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
    ]))
    elements.append(crdt_table)
    elements.append(Spacer(1, 4))

    elements.append(Paragraph("Subsystem Breakdown & Implementation Anatomy:", h2_style))
    subsystems_data = [
        [
            Paragraph("<b>Subsystem</b>", meta_label),
            Paragraph("<b>Key Source Files</b>", meta_label),
            Paragraph("<b>Architectural Responsibility & Technical Highlights</b>", meta_label)
        ],
        [
            Paragraph("<b>Auth & Session Hydration</b>", body_bold),
            Paragraph("frontend/src/context/AuthContext.jsx<br/>backend/app/core/security.py", body_style),
            Paragraph("Optimistic hydration from localStorage (0ms render). Non-blocking background revalidation with 8s AbortController timeout; logs out only on explicit 401 Unauthorized status.", body_style)
        ],
        [
            Paragraph("<b>WebSocket & Presence Engine</b>", body_bold),
            Paragraph("backend/app/websocket/handler.py<br/>backend/app/services/presence_service.py", body_style),
            Paragraph("Inverted room index: doc_id -> {client_id -> UserPresence}. Ping-pong heartbeat touch (25s), 45s stale reaper, multi-tab user deduplication, and guaranteed cleanup via try...finally blocks.", body_style)
        ],
        [
            Paragraph("<b>TipTap v3 Rich Text</b>", body_bold),
            Paragraph("frontend/src/components/TipTapEditor.jsx<br/>frontend/src/components/EditorToolbar.jsx", body_style),
            Paragraph("ProseMirror AST schema (Nodes & Marks), y-prosemirror binding to Y.XmlFragment, collaborative cursors with user colors/names via Ephemeral Awareness Protocol.", body_style)
        ],
        [
            Paragraph("<b>Excalidraw Vector Whiteboard</b>", body_bold),
            Paragraph("frontend/src/components/ExcalidrawBoard.jsx<br/>frontend/src/pages/EditorPage.jsx", body_style),
            Paragraph("Dynamic code-splitting with React.lazy and Suspense boundaries (saving 1.8 MB). WebSocket broadcast_draw streaming with 500ms debounced persistence to PostgreSQL JSONB.", body_style)
        ],
        [
            Paragraph("<b>Persistence & Write-Behind</b>", body_bold),
            Paragraph("backend/app/services/write_behind_buffer.py<br/>backend/app/core/database.py", body_style),
            Paragraph("Sliding-window in-memory buffer protecting Neon PostgreSQL from write collapse. Flushes canonical HTML and state vectors on 2s idle, 5s dirty window timeout, or room exit.", body_style)
        ]
    ]
    subsystems_table = Table(subsystems_data, colWidths=[110, 160, 270])
    subsystems_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), c_header_bg),
        ('BOX', (0, 0), (-1, -1), 0.5, c_border),
        ('INNERGRID', (0, 0), (-1, -1), 0.3, colors.HexColor("#E2E8F0")),
        ('TOPPADDING', (0, 0), (-1, -1), 2),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
        ('LEFTPADDING', (0, 0), (-1, -1), 4.5),
        ('RIGHTPADDING', (0, 0), (-1, -1), 4.5),
    ]))
    elements.append(subsystems_table)

    # Exact Page Break to Page 3
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 3: FIVE REAL-WORLD ENGINEERING CHALLENGES (STAR STORIES)
    # =========================================================================
    elements.append(Paragraph("4. Key Engineering Challenges Solved (STAR Behavioral Interview Stories)", h1_style))
    elements.append(Paragraph("<i>These five battle-tested engineering war stories showcase real-world problem-solving under Google's STAR framework:</i>", body_style))

    star_stories = [
        ("Story 1: The ContentEditable Cursor Jumping Disaster (ProseMirror Migration)",
         "<b>Situation:</b> Initial prototype used a raw HTML &lt;div contenteditable&gt; with document.execCommand for rich text.<br/>"
         "<b>Task:</b> Eliminate violent cursor jumps to position 0 on every keystroke and clean up invalid nested HTML tags.<br/>"
         "<b>Action:</b> Re-architected editor to TipTap v3 based on ProseMirror's immutable Abstract Syntax Tree (AST). All mutations were mapped to transactional state transitions with forward selection projection.<br/>"
         "<b>Result:</b> 100% elimination of cursor jumping, clean semantic HTML output, and effortless collaborative cursor integration."),

        ("Story 2: Eliminating Ghost Users on Unclean WebSocket Drops",
         "<b>Situation:</b> When users abruptly closed browser tabs or experienced WiFi drops, presence counts showed ghost users lingering forever.<br/>"
         "<b>Task:</b> Build a guaranteed presence lifecycle that handles abrupt TCP terminations gracefully.<br/>"
         "<b>Action:</b> Implemented a 3-tier presence model: (1) Client 25s ping-pong keepalives triggering presence_service.touch(); (2) 45s server-side background sweeper purging dead sockets; (3) FastAPI WebSocket loop wrapped in a strict try...finally block guaranteeing presence_leave broadcast; (4) Multi-tab user deduplication grouping by user_id.<br/>"
         "<b>Result:</b> 100% accurate presence counts with zero phantom users, even under simulated dirty network termination."),

        ("Story 3: Optimistic Session Hydration Eliminating 60s Container Cold Starts",
         "<b>Situation:</b> On free-tier cloud containers (Render), idle containers spin down after 15m. Refreshing the browser triggered a synchronous /auth/me call that hung the UI on 'Loading AetherDoc...' for up to 60 seconds.<br/>"
         "<b>Task:</b> Achieve instant 0ms page load while maintaining secure backend authentication.<br/>"
         "<b>Action:</b> Engineered an Optimistic Session Hydration state machine in React AuthContext: if token & user exist in localStorage, initialize loading to false immediately. In parallel, run an asynchronous non-blocking background revalidation with an 8-second AbortController timeout. Only trigger logout on explicit 401 Unauthorized status (ignoring network blips).<br/>"
         "<b>Result:</b> Instantaneous 0ms editor loads on browser reload, with zero risk of user session loss during server restarts."),

        ("Story 4: Slashing Initial Bundle Size by 62% via Dynamic Code Splitting",
         "<b>Situation:</b> Bundling Excalidraw's vector canvas into the main entry point resulted in a 2.45 MB bundle, causing a 4.2s First Contentful Paint (FCP) on mobile networks.<br/>"
         "<b>Task:</b> Optimize bundle delivery so text document users never pay the payload penalty of the vector engine.<br/>"
         "<b>Action:</b> Implemented dynamic code-splitting using React.lazy and Suspense boundaries. Excalidraw chunks are downloaded on-demand only when the user switches to the 'Whiteboard' tab.<br/>"
         "<b>Result:</b> Reduced initial bundle size by 62% (to 800 KB) and dropped FCP to 1.1s, dramatically boosting Core Web Vitals."),

        ("Story 5: Database Write Saturation Protection via In-Memory Write-Behind Buffer",
         "<b>Situation:</b> In high-concurrency rooms (30-50 simultaneous typists), writing every keystroke directly to PostgreSQL exhausted the Neon connection pool and triggered HTTP 500 errors.<br/>"
         "<b>Task:</b> Decouple real-time sub-20ms WebSocket messaging from database durability without risking document loss.<br/>"
         "<b>Action:</b> Built an in-memory sliding-window Write-Behind Buffer. Operations are held in RAM and broadcast to peers instantly. A debounced background worker flushes compiled HTML and binary state vectors to PostgreSQL only when the room is idle for 2s, or when 5s have elapsed since last write, or upon room exit.<br/>"
         "<b>Result:</b> 95% reduction in database write IOPS while maintaining complete document durability.")
    ]

    for title, story in star_stories:
        story_content = [
            Paragraph(title, story_header),
            Spacer(1, 1),
            Paragraph(story, story_body)
        ]
        story_table = Table([[story_content]], colWidths=[540])
        story_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
            ('BOX', (0, 0), (-1, -1), 0.5, c_border),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(story_table)
        elements.append(Spacer(1, 3))

    # Exact Page Break to Page 4
    elements.append(PageBreak())

    # =========================================================================
    # PAGE 4: GOOGLE ARCHITECT INTERVIEW Q&A & MASTER CHATGPT PROMPTS
    # =========================================================================
    elements.append(Paragraph("5. Google Staff/Principal Architect Interview Questions & Model Answers", h1_style))
    elements.append(Paragraph("<i>Crucial System Design & Distributed Systems Q&A for L5/L6 FAANG interview loops:</i>", body_style))

    interview_qa = [
        ("Q1: How does the YATA CRDT algorithm guarantee convergence without a central coordinator?",
         "YATA models the document as a doubly linked list of Item nodes with immutable originLeft and originRight pointers. When concurrent inserts collide between the same boundaries, a deterministic total order is enforced by comparing client IDs (itemA.id.client > itemB.id.client) and monotonic clocks. All peers execute the exact same rule locally, reaching mathematical convergence without roundtrip consensus."),
        
        ("Q2: How do you prevent database collapse when 100 users generate 1,000 keystrokes/second?",
         "Strictly decouple the hot operational path from the cold durability path. Real-time updates are transmitted as binary CRDT deltas over WebSockets and broadcast in-memory (<15ms latency). An asynchronous Write-Behind Buffer flushes compiled HTML and state vectors to PostgreSQL only upon 2s document idle, 5s dirty window timeout, or room exit."),

        ("Q3: What happens during a 2-hour network partition between New York and London peers?",
         "Both partitions continue editing locally at full speed (local-first autonomy). When the network heals, peers exchange compact State Vectors. Each side computes and transmits only the missing binary delta (doc.diff(remote_state_vector)). Both call Y.applyUpdate(), and YATA deterministically weaves operations into the linked list with zero data loss."),

        ("Q4: How do you scale this architecture horizontally to 100,000 concurrent rooms across 50 nodes?",
         "Terminate WebSockets at an L7 Load Balancer (Envoy/Cloudflare) configured with Consistent Hashing on the URL path (/ws/documents/{doc_id}), ensuring room connections land on the same physical server. For multi-node rooms or server failover, wire nodes together using a distributed Redis Pub/Sub cluster keyed by doc:channel:{doc_id}.")
    ]

    for q, a in interview_qa:
        qa_content = [
            Paragraph(q, q_title),
            Spacer(1, 1),
            Paragraph(a, q_ans)
        ]
        qa_table = Table([[qa_content]], colWidths=[540])
        qa_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_bg_light),
            ('BOX', (0, 0), (-1, -1), 0.5, c_border),
            ('TOPPADDING', (0, 0), (-1, -1), 2),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(qa_table)
        elements.append(Spacer(1, 3))

    elements.append(Spacer(1, 3))

    # Master Prompts
    elements.append(Paragraph("6. Ready-to-Copy Master Prompts for ChatGPT / Claude", h1_style))
    elements.append(Paragraph("<i>Copy and paste these exact prompts into ChatGPT along with this PDF dossier to generate custom resume assets:</i>", body_style))

    prompts = [
        ("Master Prompt 1: Generate 1-Page FAANG / Tier-1 Software Engineering Resume",
         "I am providing you with the comprehensive engineering dossier of my production project 'AetherDoc' (a distributed real-time collaborative document and vector canvas editor). "
         "Act as a Principal Recruiter and Hiring Manager at Google/Meta. "
         "Using Google's XYZ formula ('Accomplished [X] as measured by [Y] by doing [Z]'), write a standout, high-impact 'Projects / Experience' section for my resume. "
         "Highlight: Yjs CRDT concurrency (YATA), TipTap/ProseMirror AST architecture, optimistic session hydration, sub-20ms WebSocket sync, -62% bundle optimization, and PostgreSQL write-behind buffering. "
         "Format with crisp, professional bullet points, bold key metrics, and strong action verbs."),

        ("Master Prompt 2: Generate Distributed Systems & Backend Focus Resume",
         "Based on the AetherDoc project dossier, write a specialized 'Distributed Systems & Backend' experience entry for my resume targeting Staff/Senior Backend Engineer roles. "
         "Emphasize: CRDT mathematical convergence vs OT, FastAPI asynchronous WebSocket connection lifecycle, inverted index room management, Neon serverless PostgreSQL connection pooling, and sliding-window write-behind buffering. Include specific metrics and production challenges solved.")
    ]

    for p_title, p_text in prompts:
        prompt_content = [
            Paragraph(f"<b>{p_title}</b>", meta_label),
            Spacer(1, 1),
            Paragraph(p_text, prompt_style)
        ]
        p_table = Table([[prompt_content]], colWidths=[540])
        p_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), c_code_bg),
            ('BOX', (0, 0), (-1, -1), 0.5, c_border),
            ('TOPPADDING', (0, 0), (-1, -1), 2.5),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 2.5),
            ('LEFTPADDING', (0, 0), (-1, -1), 5),
            ('RIGHTPADDING', (0, 0), (-1, -1), 5),
        ]))
        elements.append(p_table)
        elements.append(Spacer(1, 3))

    # Build PDF with NumberedCanvas
    doc.build(elements, canvasmaker=NumberedCanvas)
    print(f"PDF successfully built at: {filename}")

if __name__ == "__main__":
    out_path = sys.argv[1] if len(sys.argv) > 1 else "AetherDoc_Project_Dossier_For_Resume.pdf"
    build_pdf(out_path)
