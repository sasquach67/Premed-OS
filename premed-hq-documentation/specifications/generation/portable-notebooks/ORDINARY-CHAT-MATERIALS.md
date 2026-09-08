# Ordinary-chat materials: dated guidance and manual case

Provider guidance checked **2026-09-08**. This note is separate from the permanent canonical method and may become outdated. It does not verify Andy's account, selected model or an actual Plus trial. No numeric upload caps are embedded in the prompts.

OpenAI's File Uploads FAQ distinguishes Enterprise PDF visual retrieval from text-based retrieval for other plans/documents. For ordinary Plus use, digital PDF text retrieval should not be treated as proof that embedded figures or scanned/handwritten content was inspected. [File Uploads FAQ](https://help.openai.com/en/articles/8555545-file-uploads-faq)

The Image Inputs FAQ describes adding images directly to conversations and warns that ambiguous images can be interpreted inaccurately. It recommends improving text readability without cropping important details; graphs, visual styles and spatial relationships can also be difficult. A clear relevant image may help, but it does not guarantee correct handwriting, formula or arrow interpretation. [Image Inputs FAQ](https://help.openai.com/en/articles/8400551-chatgpt-image-inputs-faq)

Projects organize related chats, instructions and uploaded sources. The ordinary-chat notebook workflow deliberately uses directly supplied material without requiring a project. A local folder path is not a recursive upload, and project organization does not establish that each needed source was inspected. [Projects in ChatGPT](https://help.openai.com/en/articles/10169521-projects-in-chatgpt)

Practical method: supply supported files or paste text; add clear direct images of needed question/handwriting/figure pages when those visuals are missing or unclear. Preserve the full setup, choices, caption and relevant diagram context. Ask the AI to identify actual inspected portions and consequential ambiguity. OCR, ZIPs and merged scans are not proof of completeness. Work in topic batches with all requirements and visual gaps retained.

The authored `ordinary-plus-mixed-materials` case in [EXPECTED-CONVERSATIONS.md](EXPECTED-CONVERSATIONS.md) combines a digital-text textbook PDF, a question screenshot, handwriting and an unavailable embedded figure. Its expected pause requests the specific figure and ambiguous handwritten region; supported work continues. The final gate still requires actual readable prepared content and explicit confirmation before JSON.

Andy supplies actual material, runs the ordinary Plus trial and records real behavior and ratings. No such trial was performed here; filesystem-enabled Codex processing cannot validate this Plus path. The same permanent source-integrity rules apply conditionally to other chosen AI environments without assuming identical capabilities.
