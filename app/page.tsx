export default function Home() {
  return (
    <main style={{ padding: 40, fontFamily: 'sans-serif' }}>
      <h1>虚拟香港虚拟机场管理局 VAAHK</h1>
      <p>
        <a href="/api/auth/login">登录</a> | <a href="/api/auth/logout">登出</a>
      </p>
    </main>
  );
}
