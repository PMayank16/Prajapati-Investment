export default function Card({ title, children }) {
    return (
      <div className="bg-black border border-gray-600 shadow rounded-lg p-4">
        <h2 className="text-lg font-semibold mb-2">{title}</h2>
        {children}
      </div>
    );
  }
  