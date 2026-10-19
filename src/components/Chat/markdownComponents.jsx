import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import { isValidElement } from 'react';
import ChartBlock from './ChartBlock';

// Компоненты для кастомного рендера Markdown: блоки кода, графики, таблицы

const CHART_TYPES = ['bar', 'line', 'pie'];

// Возвращает объект графика, если JSON валидный и структура подходит, иначе null
function parseChart(raw) {
    try {
        const parsed = JSON.parse(raw);
        const isValid =
            parsed &&
            CHART_TYPES.includes(parsed.type) &&
            Array.isArray(parsed.data) &&
            parsed.data.length > 0 &&
            parsed.data.every((d) => typeof d.name === 'string' && typeof d.value === 'number');
        return isValid ? parsed : null;
    } catch {
        return null;
    }
}

// Определяет, является ли code-блок графиком: метка chart ИЛИ блок без языка с JSON
function getChartFromCode(className, children) {
    const match = /language-(\w+)/.exec(className || '');
    const raw = String(children).replace(/\n$/, '');

    if (match?.[1] === 'chart' || (!match && raw.trimStart().startsWith('{'))) {
        return parseChart(raw);
    }
    return null;
}

const markdownComponents = {
    code({ node, inline, className, children, ...props }) {
        // 1. График
        const chart = getChartFromCode(className, children);
        if (chart) {
            return <ChartBlock {...chart} />;
        }

        const match = /language-(\w+)/.exec(className || '');
        const raw = String(children).replace(/\n$/, '');

        // 2. Обычный блок кода с подсветкой
        if (!inline && match) {
            return (
                <SyntaxHighlighter
                    style={oneDark}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                        borderRadius: '12px',
                        fontSize: '13px',
                        margin: '12px 0',
                        scrollbarWidth: 'none',
                        msOverflowStyle: 'none',
                    }}
                    {...props}
                >
                    {raw}
                </SyntaxHighlighter>
            );
        }

        // 3. Инлайн-код и блоки без языка
        return (
            <code className={className} {...props}>
                {children}
            </code>
        );
    },

    pre({ node, children, ...props }) {
        const child = Array.isArray(children) ? children[0] : children;

        // Если внутри <pre> лежит график, отдаём его без обёртки <pre>
        if (isValidElement(child)) {
            const chart = getChartFromCode(child.props.className, child.props.children);
            if (chart) {
                return child;
            }
        }

        return <pre {...props}>{children}</pre>;
    },

    table({ node, children, ...props }) {
        return (
            <div className="markdown-table-wrapper">
                <table {...props}>{children}</table>
            </div>
        );
    },
};

export default markdownComponents;