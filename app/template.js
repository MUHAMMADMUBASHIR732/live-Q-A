// A template re-mounts on every navigation, which gives each page a quick fade-in.
export default function Template({ children }) {
  return <div className="page-in">{children}</div>;
}
