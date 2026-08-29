---
title: "当模型离开熟悉的 Harness：LLM 智能体的配置效应、适配与评测"
date: 2026-08-29
author: Adam
description: 基于公开证据综述 harness 对 LLM 智能体表现的影响：同一模型在不同 harness 下成本与失败模式的差异、陌生工具 schema 上的调用回归，及其对评测与工程实践的启示。
permalink: /posts/2026/08/29/harness-overfit-llms/
categories: [学术写作]
tags: [Agent Harness, Harness Overfitting, 智能体评测, 学术写作]
---
## 摘要

公开榜单往往将智能体能力归因于“模型”，而用户实际使用的却始终是“模型 + harness”的组合。一项受控研究发现：在相同任务、环境和预算下，更换 harness 可使同一模型每个成功任务的 token 消耗相差约 40 倍；通过率的点估计也会出现 0–8 个百分点的差异，但除最大差异外，其置信区间包含零 [3]。另有工程报告观察到，较新的模型在陌生工具 schema 上可能更容易生成不合规参数 [1]。这些证据共同表明，智能体的可观测表现不能被简单视为基础模型的固有属性。

本文以“harness 过拟合”作为描述性术语，讨论模型对特定工具表面、提示词结构、执行循环和容错方式的适配与依赖。需要区分的是：harness 会显著影响结果已有直接实证；而这种影响在多大程度上来自 post-training 分布、又在多大程度上来自运行时的编排与约束，仍是有待检验的机制问题。本文据此梳理现有证据、提出可能机制，并明确其论证边界。

文章的结论是，评测和选型应将 model–harness configuration 作为报告单元：除通过率外，同时披露成本、延迟、失败模式及完整 harness 配置。对智能体工程而言，更可行的目标不是假定模型与 harness 可以无损互换，而是在同一套可维护的框架中，为不同模型保留可评测、可版本化的适配层。

**关键词**：agent harness；harness overfitting；model-harness fit；harness 评测；scaffold effect；strict decoding

---

## 1 引言

2026 年，智能体工程中的一个问题愈发突出：排行榜上的分数究竟应归因于模型，还是归因于完整的执行系统？后者至少包括工具表面、上下文管理、权限和沙箱、重试策略、停止条件与验证环路。Vats 与 Golev 的受控研究显示，在固定模型、任务环境和预算控制后，更换 harness 仍会带来高达约 40 倍的每解 token 成本差异；通过率的差异则处于 0–8 个百分点区间，且多数比较的不确定性较大 [3]。

工程实践也提供了更细粒度的信号。Ronacher 记录到：Claude Opus 4.8 在 Pi 的嵌套编辑工具上偶尔生成 schema 之外的键（如 `type`、`kind`、`in_file`、`oldText2`）；在其复现的长上下文会话中，失败率约为 20%，而开启严格工具调用后该问题消失 [1]。这是一个有价值的案例，但它是单一工具表面上的工程观察，不能单独推出“新模型整体更差”的结论。

Bustamante 将这类现象概括为 **“Model-Harness Fit”** [2]：模型的工具使用习惯会与某套运行时约定相互适配。该说法为工程决策提供了有用框架，但其中关于 post-training 的具体因果解释仍主要是工程推断，而非已被独立验证的结论。

本文用 **“harness 过拟合”** 指称模型对特定 harness 的过强依赖，而不将其视为已标准化的学术术语。下文将区分三类材料：受控实验提供的配置级效应、诊断性基准揭示的执行差异，以及工程团队和开发者提出的机制解释。文章的目标是说明：仅按模型名排列智能体，往往遗漏了影响用户体验的关键变量；同时也避免把尚未验证的机制写成既成事实。

---

## 2 方法

本文不是一项新的模型实验，而是一篇基于公开材料的结构化综述。研究问题有三个：第一，现有证据是否显示 harness 会改变同一模型的可观测表现；第二，哪些结果可以归为配置级效应，哪些只是可能的机制解释；第三，这一区分对评测和工程实践意味着什么。

### 2.1 材料与纳入标准

材料包括两类：（1）量化研究，即跨 model–harness 配置的受控实验或诊断性基准 [3, 4, 7]；（2）工程材料，即开发者或产品团队关于工具调用、模型切换和 harness 调优的复盘 [1, 2, 5]。本文优先使用前一类材料描述“观察到的结果”，使用后一类材料说明现象、提出假说或生成工程建议；不将博客中的机制推断视为因果证明。

### 2.2 分析框架

本文将每项材料编码为四个维度：比较对象（模型、harness、任务和环境）、结果指标（完成率、token、延迟、过程行为）、证据等级（受控实验、基准、工程观察）和可支持的结论强度。讨论中将“harness 效应”限定为在既定设置下结果随 harness 改变而变化；将“harness 过拟合”限定为对此现象的一种解释框架，而非已证实的训练因果。

### 2.3 报告边界

文中的通过率、成本与失败模式仅适用于各来源给定的任务、模型和版本。尤其是 [3] 的样本由两个模型和 50 个任务组成，其结果用于说明应报告配置，而不用于给所有模型或所有 harness 排名。

---

## 3 结果

### 3.1 同一模型，不同 harness，成本差 40×

Vats 与 Golev 的受控实验 [3] 是本文最直接的配置级证据。研究在 3 个 harness（Goose、OpenCode、OpenHands-SDK）、2 个模型（Qwen 3.6 Plus、MiniMax M2.5）和 50 个 Terminal-Bench Pro 任务之间进行交叉，共 300 次试验。设计上保留各 harness 的原生工具 API、上下文预加载以及内部重试或子智能体逻辑，同时固定任务指令、测试套件、沙箱、墙钟限制、网关和系统提示。也就是说，它测量的正是“原生 harness 的整体运行方式”，而非试图把所有实现差异抹平。

**表 1：Scaffold Effect 实验结果（[3]）**

| 维度 | 跨 harness 差异 |
| --- | --- |
| 通过率（同一模型内 harness 之间） | 0–8 pp；除最大差异外，95% 置信区间包含零 |
| 每解一题 token（Goose vs. OpenCode） | **最高约 40×** |
| 失败模式 | 跨两个模型呈相似模式，提示存在 harness 层偏置 |

在该实验中，Goose 的失败以 REASON 为主，且没有 VERIFY 失败；OpenHands-SDK 较多出现 VERIFY 与 MAX_TURNS；OpenCode 则更多表现为 TIME 与 HANG [3]。这些模式在两个被测模型上重复出现，因而**提示** harness 会系统性地塑造失败方式；但样本仅涵盖两个模型和 50 个任务，尚不足以把它们宣称为所有 harness 的固有属性。

含义是：当评测只报告“模型 X 的通过率”时，读者无法判断这一成绩对应哪一套工具、上下文与停止策略，更无法估计其成本和延迟。即使通过率接近，某个 harness 也可能消耗约 40 倍更多 token [3]。

### 3.2 一个陌生工具 schema 上的调用回归案例

Ronacher 的工程报告 [1] 将问题聚焦到工具调用层面。Pi 的编辑工具接受嵌套的 `edits[]` 数组，而 Claude Code 的编辑工具采用扁平的 `old_string / new_string` 形式（另有可选的 `replace_all` 标志）。在 Pi 上，他报告：

- Opus 4.5 表现稳定，能够正确适应嵌套 schema。
- Opus 4.8 与 Sonnet 5 在长上下文下持续发明 schema 之外的键，失败率约 20%；关闭 thinking block 或开启 strict 模式后失败率显著降低或消失。

Ronacher 提出的核心**假说**是 [1]：

> "If reinforcement learning happens in a harness like that [Claude Code, very forgiving of slop], or a simulation of one, then slightly malformed tool calls can still complete the task and receive reward. The harness fully absorbs the error and there is little gradient against inventing an alias, adding a stray field or using a nearby parameter name."

这一假说指出：如果 post-training 的交互轨迹来自能够吸收轻微格式错误的 harness，那么错误调用仍可能得到完成任务的奖励，模型就较少获得纠正该类错误的信号。它为“宽容度—训练信号—跨 schema 退化”提供了可信的解释路径，但尚不是对训练数据或训练流程的直接证据。

### 3.3 Model-Harness Fit：有用的工程框架，尚待实证拆解

Bustamante 对 “Model-Harness Fit” 作出了系统化的工程论述 [2]。其要点是：工具名、input schema、citation tag、skill 文件结构和规划协议，都是模型在运行时面对的具体接口约定，而非脱离接口而存在的抽象能力。

文中列举了几类可能的适配信号 [2]：

- 工具 schema 与参数命名；
- 记忆和引用的格式约定；
- 系统提示、技能文件与规划协议的结构；
- 同一任务在不同工具严格性和恢复策略下的成本与错误率。

这些观察支持“模型无关的 harness 并非自动中性”的工程判断，但并不推出必须为每个模型维护一套完全独立的栈。更稳妥的结论是：多模型系统至少需要评测和维护模型特异的工具呈现、提示词与恢复策略；配置差异应被显式记录，而不应藏在“模型名”之后。

### 3.4 Harness-Bench 量化“配置级”差异

Yao 等人的 Harness-Bench [4] 提供了跨 harness、跨模型的诊断性基准：5,194 条执行轨迹、106 个沙箱化的离线任务；它固定任务环境、预算、超时和评测协议，同时保留各 harness 的原生执行行为。

其结论是 [4]：

> "These results suggest that agent capability should be reported at the model–harness configuration level rather than attributed to the base model alone. Our analysis further identifies recurring execution-alignment failures, where plausible reasoning becomes decoupled from tool feedback, workspace state, evidence, or verifiable output contracts."

“执行对齐失败”（execution-alignment failure）与本文讨论的问题密切相关：模型的推理看似合理，却没有与工具反馈、工作区状态、证据或可验证的输出契约保持一致。它不等同于“harness 过拟合”，但说明了为何仅观察最终答案不足以诊断智能体行为。

### 3.5 Cursor：harness 需要随模型调整

Cursor 团队在“持续改进我们的智能体框架”中记录了模型切换时的工具集冲突，以及针对不同模型调整 harness 的过程 [5]：

- OpenAI 模型更适应 patch 形式的文件编辑，Anthropic 模型更适应字符串替换；为模型提供陌生的编辑工具，会增加推理 token 并提高出错率。
- 会话中途切换模型时，新模型会面对由另一模型及其工具形状产生的历史记录；因此需要切换相应的提示词与工具，并明确引导它不要调用历史中已不存在的工具。

这些材料直接支持“harness 应随模型特性调整”，但不足以证明任何厂商的原生 harness 已成为模型的不可替代“暗契约”，更不能据此判断商业护城河。de Macedo 的工作 [6] 更适合作为概念边界：它将 agent harness 与框架、SDK、IDE 插件、评测 harness 和编排器区分开来，并把 Claude Code、Codex CLI 等作为可分析的实例。

---

## 4 讨论

现有材料足以表明 harness 会显著改变智能体的成本、失败方式与部分任务表现；但对其成因仍应分层讨论。下文将训练分布、运行时容错和评测设计视为三个**可能的作用环节**，而非已经被逐一证实的因果链条。

### 4.1 可能机制一：post-training 的分布偏置

当面向智能体的 SFT 或 RL 大量使用某个 harness 的轨迹时，训练样例会反复呈现该环境的工具调用、引用格式和失败模式；奖励也会按该环境中的任务完成情况发放。于是，哪些格式偏差会被吸收、哪些会导致失败，就可能成为训练信号的一部分。

作为概念模型，可以说模型优化的更接近 `P(成功 | 当前 harness)`，而不是 `P(成功 | 任意合规工具调用)`。据此可以预期它在熟悉协议上更高效、在陌生协议上更易出错；但要将这一预期归因于 post-training，仍需获得训练数据、消融实验或受控再训练等直接证据 [1, 2]。

### 4.2 可能机制二：运行时宽容度会改变可见的错误信号

如 §3.2 所述，若 harness 在运行时吸收格式偏差，用户可能获得更流畅的体验；若这类轨迹又被用于 post-training，模型对该偏差获得的负向信号也可能减少 [1]。这一效应取决于错误是否被记录、奖励如何分配以及轨迹是否回流训练，不能从产品的“宽容”直接推出训练结论。无论其训练效应如何，严格的 schema 校验或受约束解码都能把一部分正确性要求前移到执行层，降低对模型自发遵守格式的依赖。

### 4.3 评测结果依赖 harness 配置

[3] 与 [4] 表明，公开榜单上的“通过率”应被理解为某一 model–harness configuration 在指定评测条件下的结果。以某个 Terminal-Bench 分数作为选型依据时，所依据的是“在该任务集、环境、预算、工具配置和 system prompt 下的结果”，而不是脱离运行条件的模型固有能力。

这可能形成两个反馈回路：

- **训练–评测回路**：训练环境越接近被频繁使用的评测环境，模型越可能在该环境中取得更高分；这会激励厂商关注主流评测条件。
- **评测–部署回路**：部署环境越接近评测配置，榜单结果越可能对实际体验具有预测性；用户也因而更倾向采用已有公开数据的工具链。

若这两种回路持续存在，某些 harness 约定可能逐渐成为事实标准，模型的跨 harness 可迁移性也将成为需要单独测量的能力。

---

### 4.4 工程与评测含义

#### 4.4.1 对评测：从“按模型名排序”转向“报告配置”

[3] 的建议不是废弃所有模型比较，而是在比较时固定并完整披露 harness；当 harness 不同时，则应把 model–harness configuration 作为报告单元。[3, 4] 所支持的最低报告集包括：

- 任务完成率，以及置信区间或重复试验信息；
- 每个成功任务的 token、成本与延迟；
- 失败类别、无操作轮次等过程指标；
- 完整的 harness 说明：工具、system prompt、预算、停止与重试策略、环境和版本。

因此，“模型 X 在基准 Y 上达到 Z%”不足以支持实际选型；更有用的表述应是：“模型 X 在版本为 V 的 harness、指定预算与环境中达到 Z%，并消耗 C 成本和 L 延迟。”模型比较在 harness 固定时仍有意义，问题在于把不同 harness 下的结果伪装为纯模型排名。

#### 4.4.2 对工程：把 harness 当作可版本化的适配层

[2] 提醒，多模型支持会带来真实的工程复杂度：

> "Supporting BYOK and multi model (which is the responsible posture, since relying on a single provider is risky) adds real engineering complexity, and that complexity is worth paying."

更稳妥的工程含义是：

- 将工具 schema、system prompt、上下文压缩、重试和停止策略版本化，并把它们与模型版本一同纳入评测；
- 在一套通用编排框架中，为不同模型保留可配置的工具形式和提示词变体，而不是假定同一设置必然最优；
- 在模型升级或中途切换后，重新运行小规模的回归测试，尤其检查工具调用错误、成本和长上下文表现 [5]。

#### 4.4.3 对架构：硬约束是重要的兜底，而非唯一解

[1] 表明，当模型对陌生 schema 的遵循性下降时，harness 需要在模型之外提供更强的保证：

> "If the newest models get better at solving the task while getting worse at faithfully emitting an alternative tool schema, then the harness needs stronger guarantees somewhere."

具体建议如下：

- 对可结构化的工具输入，使用严格的 JSON Schema 校验或受约束解码；对不满足约束的调用，提供明确、可恢复的错误反馈。
- 对需要自由文本的工具，可在推理运行时使用上下文无关文法（如 Lark CFG）约束特定语法或 DSL。应注意：Harmony 中的 `<|constrain|>json` 是工具调用的内容类型标记；要获得 schema 级保证，仍需要推理端实际施加文法或 schema 约束 [8, 9]。
- 将约束视为可靠性措施，而非能力替代品：它能防止格式性错误，却不能自动解决上下文选择、任务分解、工具语义理解或验证不足。
- Life-Harness 说明了运行时适配的潜力：它在不更新模型权重的情况下，于 126 个模型–环境配置中的 116 个取得提升，平均相对提升 88.5%。不过，该方法从特定模型的轨迹中演化再迁移到其他模型，不能简单称为“独立于模型” [7]。

#### 4.4.4 对未来：模型与 harness 的协同将成为竞争变量

[2] 的收尾判断值得记住：

> "The model is no longer the moat alone, and the matched pair shifts as the model matures."

更审慎的表述是：模型与 harness 的协同可能成为竞争变量，但“护城河”仍取决于模型能力、产品分发、数据、生态和执行质量等多项因素。这一视角至少带来三点启示：

- 模型供应方需要关注其模型在常见运行时中的可迁移性，而不仅是原生产品的表现；
- harness 供应方需要持续针对模型版本回归测试，及时移除已失效的脚手架并补足新的薄弱点；
- 对用户而言，最值得比较的是可复现的“模型 + harness”体验，而不是将一方神化为另一方的替代品。

---

### 4.5 面向不同读者的建议

#### 4.5.1 模型选型

- 不要看单一榜单通过率；看“在你的目标 harness 上”的多指标，包括成本、延迟、失败方式和监督负担 [3, 4]。
- 对候选模型做目标 harness 内外的微评测（例如 5–10 个代表性真实任务），重点观察工具调用、成本和长上下文表现 [1, 3, 4]。
- 将“harness 切换测试”作为新模型验收项；若样本较小，应将结果视为风险信号而非确定排名。

#### 4.5.2 智能体系统

- 把 harness 当作版本化、可复现、可评测的资产，而不只是零散的提示词脚本 [4, 6]。
- 多模型支持至少意味着多套可配置、可测试的适配层；不要假定只替换模型名称就能保持体验 [2, 5]。
- 在工具边界实施 JSON Schema 校验、文法约束和可恢复的错误反馈，把“任务推理正确”和“调用格式正确”分开治理 [8, 9]。

#### 4.5.3 模型训练

- 记录训练交互中哪些格式错误被运行时吸收、哪些被明确反馈；只有在相关轨迹进入训练时，宽容度才会直接改变学习信号 [1]。
- 把陌生 harness 适配性作为一个待测维度：它可被视为面向工具 schema、提示词结构和执行协议的分布外泛化。
- 在 post-training 中混合多个工具 schema 与恢复策略，是提升可迁移性的合理研究假设；其收益应通过受控消融验证，而不应预先视为定论。

---

### 4.6 结论

本文的证据支持一个较窄、也更可靠的结论：harness 会显著改变智能体的成本、过程行为和部分任务结果；因此，模型名不足以完整描述用户得到的能力。跨 harness 的通过率差异在现有小样本受控研究中并不总是统计显著，但成本差异和失败模式差异已足以影响实际选型 [3, 4]。

“harness 过拟合”应被当作待检验的解释框架，而非已经完成证明的因果定律。模型在陌生 schema 上的回归、供应商为不同模型定制工具表面，以及运行时适配方法的迁移收益，都与这一框架相容；但它们不能单独证明某种 post-training 过程必然导致了这种依赖 [1, 2, 5, 7]。

对评测者、模型提供方和使用者而言，最实用的改变是相同的：报告并复现实验中的完整 model–harness configuration；同时衡量成功率、成本、延迟和失败过程；在模型或 harness 更新后重新验证。这样，榜单才更可能为真实部署提供可迁移的决策信号。

---

## 资料说明

本文混合使用了不同证据等级的材料。Vats 与 Golev、Harness-Bench、Life-Harness 和 de Macedo 的工作均为 arXiv 预印本，提供了受控实验、基准或概念分析，但仍应结合后续同行评审与复现结果理解 [3, 4, 6, 7]。Ronacher、Bustamante 与 Cursor 的文章则是高价值的工程一线观察和设计说明，不是独立的因果验证 [1, 2, 5]。文中已相应区分“观察到的结果”“作者提出的解释”与“本文的工程建议”。

---

## 参考文献

[1] Ronacher, A. Better Models: Worse Tools — About an aggravating tool-calling regression in newer Claude models. 2026-07-04. https://lucumr.pocoo.org/2026/7/4/better-models-worse-tools/

[2] Bustamante, N. Model-Harness-Fit — Why mixing a frontier model with a foreign harness quietly tanks performance. 2026-05-03. https://nicolasbustamante.com/blog/model-harness-fit

[3] Vats, N. and Golev, O. The Scaffold Effect in Coding Agents: Harness Choice as a Hidden Variable in Coding-Agent Evaluation. arXiv:2607.22585, 2026. https://arxiv.org/abs/2607.22585

[4] Yao, Y., Tan, X., Liu, C.-H., Li, Y., Wang, Z., Yu, W., Tan, Z., Tian, Y., Zhao, G., Sun, L., Zhang, X., and Yang, T. Harness-Bench: Measuring Harness Effects across Models in Realistic Agent Workflows. arXiv:2605.27922, 2026. https://arxiv.org/abs/2605.27922

[5] Heule, S. and Katz, J. Continually Improving our Agent Harness. Cursor Blog, 2026-04-30. https://cursor.com/blog/continually-improving-agent-harness

[6] de Macedo, S. O. What makes a harness a harness: necessary and sufficient conditions for an agent harness. arXiv:2606.10106, 2026. https://arxiv.org/abs/2606.10106

[7] Xu, T., Wen, H., and Li, M. Adapting the Interface, Not the Model: Runtime Harness Adaptation for Deterministic LLM Agents (Life-Harness). arXiv:2605.22166, 2026. https://arxiv.org/abs/2605.22166

[8] OpenAI. Model guidance: GPT-5.2 — Constraining outputs. https://developers.openai.com/api/docs/guides/latest-model?model=gpt-5.2 (accessed 2026-08-29).

[9] OpenAI. Harmony response format — Receiving tool calls and structured output. https://github.com/openai/harmony/blob/main/docs/format.md (accessed 2026-08-29).

---

## 附录：术语表

| 术语 | 含义 |
| --- | --- |
| Harness（智能体框架） | 将模型接入工具、状态、权限、执行循环和反馈通道的软件层；需与 agent framework、SDK、IDE 插件和评测 harness 区分 [6] |
| Model-Harness Fit | 一个工程概念：模型的效果取决于其与工具表面、提示词和执行策略的匹配程度 [2] |
| Harness overfitting | 本文使用的描述性术语，指模型对特定 harness 的过强依赖；其具体机制仍待实证检验 |
| Scaffold Effect | 在受控研究中，harness 选择导致同一模型的每解 token 成本最高相差约 40×，通过率点估计相差 0–8 pp 的现象 [3] |
| Execution-Alignment Failure | 推理看似合理，却与工具反馈、工作区状态、证据或可验证输出契约脱节的失败类型 [4] |
| Strict / constrained decoding | 由推理端以 schema 或文法约束输出空间的技术；是否能保证合规取决于约束是否被实际施加 [8, 9] |
