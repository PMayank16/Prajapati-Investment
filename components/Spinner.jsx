// components/Spinner.js
export default function Spinner({ size = 'large' }) {
    const sizeClass = size === 'small' ? 'w-4 h-4 border-2' : 'w-8 h-8 border-4'
  
    return (
      <div className={`border-t-4 border-blue-500 rounded-full animate-spin ${sizeClass} border-transparent`} />
    )
  }
  