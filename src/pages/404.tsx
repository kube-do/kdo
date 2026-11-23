import React from 'react';
import Layout from '@theme/Layout';
import Link from '@docusaurus/Link';

export default function NotFound(): React.ReactElement {
  return (
    <Layout title="页面不存在" description="请求的页面不存在或已移动。">
      <main className="container margin-vert--xl">
        <div className="row">
          <div className="col col--8 col--offset-2">
            <h1>404：页面不存在</h1>
            <p>
              页面可能已经移动、下线，或者链接地址有误。可以回到文档首页，或从下面的入口继续查找。
            </p>
            <ul>
              <li>
                <Link to="/docs/">文档首页</Link>
              </li>
              <li>
                <Link to="/docs/quick-start/">快速开始</Link>
              </li>
              <li>
                <Link to="/docs/reference/">参考手册</Link>
              </li>
              <li>
                <Link to="/docs/reference/task-index/">任务索引</Link>
              </li>
            </ul>
            <p>
              如果是从旧链接进入，请尝试去掉或补上末尾斜杠；旧页面通常会自动跳转到新地址。
            </p>
          </div>
        </div>
      </main>
    </Layout>
  );
}
