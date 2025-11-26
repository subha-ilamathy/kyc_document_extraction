# Fireworks KYC Vision Snapshot

KYC PoC powered by Fireworks AI vision models.


## Replication Steps

1. Create & activate Python env
   ```bash
   python3.11 -m venv venv
   source venv/bin/activate
   ```
2. Install backend deps
   ```bash
   pip install -r requirements.txt
   ```
3. Add your Fireworks key
   ```bash
   export FIREWORKS_API_KEY="your_key"
   ```
4. Run FastAPI backend
   ```bash
   ./start_api.sh
   ```
5. Start Lovable dashboard
   ```bash
   cd dashboard
   npm install
   npm run dev
   ```
6. Open `http://localhost:5173`, upload an ID image, and watch Fireworks OCR drive the bounding-box view in real time.

## Demo Video


[![Watch the demo](./thumbnail.png)](https://drive.google.com/file/d/1XhET9Fb1xxjjVIUdyn3srXS9JeEVgLKt/view?usp=sharing "View the full walkthrough on Google Drive")

Here's the demo: [View the video](https://drive.google.com/file/d/1XhET9Fb1xxjjVIUdyn3srXS9JeEVgLKt/view?usp=sharing).


## System Design

### OCR Flow (Prompts + Processing)

- **AI-driven pre-processing**: EXIF-aware orientation fixes, adaptive resizing, and dynamic channel normalization feed the model a normalized tensor every time.
- **Prompt-programmed extraction**: doc-type heuristics generate guardrailed prompts that spell out JSON schemas, bounding-box syntax, and “no masking” rules to steer the LMM.
- **Structured inference**: the Fireworks vision-language model returns typed fields with optional confidence hints and `[x1,y1,x2,y2]` provenance for each entity.
- **Post-processing & enrichment**: FastAPI validates the AI output, attaches latency/model metadata, and caches previews so the UI can visualize the model’s rationale in sync.

```mermaid
graph LR
    U((Upload)) --> EXIF[EXIF fix]
    EXIF --> Resize[Adaptive resize]
    Resize --> Norm[Channel normalize]
    Norm --> Base64[Base64 encode]

    Base64 --> Hint{Doc hint}
    Hint --> Template[Prompt template<br/>schema + bbox rules]
    Template --> Model[qwen2p5-vl-32b-instruct]

    Model --> Validate[Schema validate]
    Validate --> Metadata[Latency + model tags]
    Metadata --> Cache[Preview cache]
    Cache --> Viz[Bounding-box UI & history]

    classDef stage fill:#0f172a,stroke:#0f172a,color:#f8fafc;
    classDef prompt fill:#1d4ed8,stroke:#1d4ed8,color:#f8fafc;
    classDef infer fill:#9333ea,stroke:#9333ea,color:#fdf4ff;
    classDef post fill:#0f766e,stroke:#0f766e,color:#f0fdf4;
    classDef ui fill:#f97316,stroke:#ea580c,color:#fff7ed;

    class U,EXIF,Resize,Norm,Base64 stage;
    class Hint,Template prompt;
    class Model infer;
    class Validate,Metadata,Cache post;
    class Viz ui;
```

### Architecture View

```mermaid
flowchart LR
    subgraph Frontend["Frontend (Lovable React)"]
        UI[Upload Widget] --> State[Realtime State Manager]
        State --> Canvas[Bounding Box Visualizer]
        State --> History[Document History Grid]
    end

    subgraph Backend["FastAPI Backend"]
        API[/POST /api/upload/]
        Store[(In-memory Doc Store)]
        Worker[Background Processor]
    end

    subgraph Fireworks["Fireworks AI"]
        Model[(qwen2p5-vl-32b-instruct)]
    end

    UI -->|File + metadata| API
    API --> Worker
    Worker -->|Image + prompt| Model
    Model -->|JSON fields + bbox| Worker
    Worker --> Store
    Store -->|poll/push| State
    State --> Canvas
    State --> History

    classDef infra fill:#0f172a,stroke:#0f172a,color:#f8fafc;
    classDef service fill:#1d4ed8,stroke:#1d4ed8,color:#f8fafc;
    classDef data fill:#0f766e,stroke:#0f766e,color:#f8fafc;

    class Frontend infra;
    class Backend service;
    class Fireworks service;
    class Store data;
```

## Model Choices & Deployment Modes

- **Serverless presets**
  - `accounts/fireworks/models/qwen2p5-vl-32b-instruct` (primary OCR with bbox fidelity)
  - `accounts/fireworks/models/qwen2-vl-72b-instruct` (broad context + multilingual support)
  - `accounts/fireworks/models/llava-v1.5-13b` (lightweight sanity checks)
- **On-demand deployments**
  - Plug in any custom Fireworks deployment ID (e.g., `accounts/myorg/models/passport-fast`)
  - Choose Fireworks shapes (Fast / Throughput / Minimal) to balance latency vs. cost
  - Enter the deployment path in the dashboard after selecting “On-demand”
- **Runtime switching**
  - Frontend sends `model` + `deployment_type` on every upload
  - FastAPI forwards those options directly to Fireworks, so serverless and on-demand share the same processing pipeline

## Internal Working

```mermaid
sequenceDiagram
    participant U as User
    participant FE as React Dashboard
    participant BE as FastAPI Backend
    participant FW as Fireworks OCR Model

    U->>FE: Drop identity document
    FE->>BE: POST /api/upload (file + model choice)
    BE->>FW: Send normalized image + prompt
    FW-->>BE: JSON with fields + bbox coordinates
    BE-->>FE: DocumentResponse (data, preview, timing)
    FE-->>U: Render fields, highlight bounding boxes
```
