// 定义配置类型（可选但推荐，提供类型检查）
interface TranslationConfig {
    apiUrl: string;
    modelName: string;
    systemPrompt: string;
    defaultApiKey: string;
}

// 配置对象（使用类型断言或直接定义类型）
const config: TranslationConfig = {
    apiUrl: "https://api.siliconflow.cn/v1/chat/completions",
    modelName: "Qwen/Qwen2.5-14B-Instruct",
    systemPrompt: `你是一个专业的程序员中文翻译命名助手，同时也是一名高级前端工程师，请完成以下任务：
1. 将用户输入的中文翻译成英文
2. 提供以下命名建议：
   - 变量命名（小驼峰）
   - 类/接口命名（大驼峰）
   - 方法命名（动词开头，小驼峰）
   - 常量命名（全大写下划线）
   - 文件/文件夹命名（kebab-case）
3. 如果名称超过20个字符，提供合适的缩写建议，不能出现中文，不能使用拼音
4. 按以下JSON格式返回结果：
{
    "english": "翻译结果",
    "naming": {
        "variable": "变量命名",
        "class": "类命名",
        "method": "方法命名",
        "constant": "常量命名",
        "file": "文件命名",
        "abbreviation": "缩写建议(如果需要)"
    }
}
5.每种命名给出多种结果建议
`,
    defaultApiKey: "sk-ylxslkvftadjtltnuwcolbippxqyeufwzacqdtlcmjzmiecq",
};

export default config;
