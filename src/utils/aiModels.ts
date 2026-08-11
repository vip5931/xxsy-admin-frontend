/**
 * AI 识别可选的千问（通义）视觉/OCR 模型。
 * 与后端 src/common/ai-models.ts 保持一致。
 * 默认值 qwen3-vl-plus 与后端 DEFAULT_AI_MODEL 一致。
 */
export interface AiModelOption {
  id: string;
  label: string;
  description: string;
}

export const AI_MODEL_OPTIONS: AiModelOption[] = [
  {
    id: 'qwen3.5-ocr',
    label: 'qwen3.5-ocr（OCR 专用旗舰·推荐）',
    description: '专为文档/表格/截图文字提取优化，OCR 能力最强',
  },
  {
    id: 'qwen3.7-plus',
    label: 'qwen3.7-plus（千问旗舰）',
    description: '旗舰多模态，通用图片文字提取，支持结构化输出',
  },
  {
    id: 'qwen3-vl-plus',
    label: 'qwen3-vl-plus（视觉理解·默认）',
    description: '默认模型，视觉理解与 OCR 均衡',
  },
  {
    id: 'qwen3-vl-flash',
    label: 'qwen3-vl-flash（视觉理解轻量）',
    description: '轻量快速，效果接近 qwen3-vl-plus',
  },
  {
    id: 'qwen3.7-flash',
    label: 'qwen3.7-flash（轻量旗舰）',
    description: '轻量低成本，图文提取效果接近旗舰',
  },
  {
    id: 'qwen-vl-ocr',
    label: 'qwen-vl-ocr（OCR 专用·旧版）',
    description: '上一代 OCR 专用模型，备选',
  },
  {
    id: 'qwen-vl-max',
    label: 'qwen-vl-max（旧版旗舰）',
    description: '上一代视觉旗舰，备选',
  },
];

export const DEFAULT_AI_MODEL = 'qwen3-vl-plus';
