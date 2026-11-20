import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

const cards = [
  {
    title: '我要开发',
    description: '创建项目、接入 Git 仓库、构建镜像、部署应用。',
    to: '/docs/developer/',
    label: '进入开发指南',
  },
  {
    title: '我要管理',
    description: '管理集群、命名空间、权限、通知与平台配置。',
    to: '/docs/admin/',
    label: '进入管理指南',
  },
  {
    title: '我要排障',
    description: '从现象和错误信息出发，定位构建、部署与运行问题。',
    to: '/docs/observability/',
    label: '查看可观测性',
  },
];

export default function Home(): React.JSX.Element {
  return (
    <Layout
      title="KDO 文档"
      description="KDO（Kubernetes DevOps Platform）官方文档：快速开始、安装、开发、管理、可观测性与参考手册。">
      <header className="kdo-hero">
        <h1>KDO 文档</h1>
        <p>
          面向云原生应用开发和运维的一站式平台。从安装到第一个应用上线，通常只需要 30 分钟。
        </p>
        <div className="kdo-actions">
          <Link className="button button--primary button--lg" to="/docs/quick-start/">
            快速开始
          </Link>
          <Link className="button button--secondary button--lg" to="/docs/install/kdo/">
            安装 KDO
          </Link>
        </div>
      </header>

      <main className="kdo-grid">
        {cards.map((card) => (
          <section className="kdo-card" key={card.title}>
            <h2>{card.title}</h2>
            <p>{card.description}</p>
            <Link className="button button--outline button--primary" to={card.to}>
              {card.label}
            </Link>
          </section>
        ))}
      </main>
    </Layout>
  );
}
