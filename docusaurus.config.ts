import path from 'node:path';
import type {Config} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'KDO 文档',
  tagline: 'Kubernetes DevOps Platform 官方文档',
  favicon: 'img/logo.svg',

  url: 'https://docs.kube-do.cn',
  baseUrl: '/',
  trailingSlash: true,

  organizationName: 'kube-do',
  projectName: 'kdo',

  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',

  i18n: {
    defaultLocale: 'zh-CN',
    locales: ['zh-CN'],
  },

  markdown: {
    format: 'detect',
    mermaid: true,
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },

  themes: ['@docusaurus/theme-mermaid'],

  presets: [
    [
      'classic',
      {
        docs: {
          path: 'site-docs',
          routeBasePath: 'docs',
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/kube-do/kdo/edit/main/',
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  plugins: [
    function elkLayoutStub() {
      return {
        name: 'elk-layout-stub',
        configureWebpack() {
          return {
            resolve: {
              alias: {
                '@mermaid-js/layout-elk': path.join(
                  process.cwd(),
                  'src/shims/layout-elk.ts',
                ),
              },
            },
          };
        },
      };
    },
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        language: ['zh', 'en'],
        indexDocs: true,
        docsRouteBasePath: '/docs',
        highlightSearchTermsOnTargetPage: true,
        explicitSearchResultPath: true,
      },
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    metadata: [
      {
        name: 'description',
        content:
          'KDO 是 Kubernetes DevOps 平台，提供应用交付、多环境管理、流水线、可观测性和平台运维能力。',
      },
      {
        name: 'keywords',
        content:
          'KDO,Kubernetes,DevOps,云原生,应用交付,Pipelines as Code,Tekton,可观测性',
      },
      {property: 'og:type', content: 'website'},
      {property: 'og:site_name', content: 'KDO 文档'},
    ],
    navbar: {
      title: 'KDO 文档',
      logo: {
        alt: 'KDO',
        src: 'img/logo.svg',
      },
      items: [
        {to: '/docs/quick-start/', label: '开始', position: 'left'},
        {to: '/docs/developer/', label: '开发', position: 'left'},
        {to: '/docs/admin/', label: '管理', position: 'left'},
        {to: '/docs/observability/', label: '可观测', position: 'left'},
        {to: '/docs/install/', label: '安装', position: 'left'},
        {to: '/docs/reference/', label: '参考', position: 'left'},
        {
          type: 'dropdown',
          label: '更多',
          position: 'left',
          items: [
            {to: '/docs/architecture/', label: '架构'},
            {to: '/docs/release-notes/', label: '发布说明'},
            {to: '/docs/contributing/', label: '贡献指南'},
          ],
        },
        {
          href: 'https://github.com/kube-do/kdo',
          label: 'GitHub',
          position: 'right',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: '文档',
          items: [
            {label: '快速开始', to: '/docs/quick-start/'},
            {label: '安装 KDO', to: '/docs/install/kdo/'},
            {label: '创建 Git 应用', to: '/docs/developer/applications/git/'},
          ],
        },
        {
          title: '参考',
          items: [
            {label: '架构与原理', to: '/docs/architecture/'},
            {label: '工作负载', to: '/docs/developer/workloads/'},
            {label: '可观测性', to: '/docs/observability/'},
            {label: '参考手册', to: '/docs/reference/'},
          ],
        },
        {
          title: '社区',
          items: [
            {label: 'GitHub', href: 'https://github.com/kube-do/kdo'},
            {label: '问题反馈', href: 'https://github.com/kube-do/kdo/issues'},
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Kubedo.`,
    },
    prism: {
      additionalLanguages: ['bash', 'yaml', 'json', 'go', 'java', 'python', 'php', 'rust'],
    },
    tableOfContents: {
      minHeadingLevel: 2,
      maxHeadingLevel: 3,
    },
    mermaid: {
      theme: {light: 'neutral', dark: 'dark'},
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
