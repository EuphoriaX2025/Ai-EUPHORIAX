import { useEffect } from 'react'
import { IonIcon } from '@ionic/react'

interface ToastProps {
  isVisible: boolean
  message: string
  type?: 'success' | 'warning' | 'error' | 'info'
  onClose: () => void
  duration?: number // Auto-close duration in milliseconds
}

export const Toast = ({
  isVisible,
  message,
  type = 'info',
  onClose,
  duration = 4000
}: ToastProps) => {
  useEffect(() => {
    if (isVisible && duration > 0) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [isVisible, duration, onClose])

  if (!isVisible) return null

  const getIcon = () => {
    switch (type) {
      case 'success':
        return 'checkmark-circle'
      case 'warning':
        return 'warning'
      case 'error':
        return 'close-circle'
      default:
        return 'information-circle'
    }
  }

  const getColorClass = () => {
    switch (type) {
      case 'success':
        return 'bg-success'
      case 'warning':
        return 'bg-warning'
      case 'error':
        return 'bg-danger'
      default:
        return 'bg-primary'
    }
  }

  return (
    <div 
      className="toast-container position-fixed top-0 end-0 p-3"
      style={{
        zIndex: 9999,
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s ease-in-out',
        maxWidth: '350px'
      }}
    >
      <div 
        className={`toast show ${getColorClass()} text-white`}
        role="alert"
      >
        <div className="toast-body d-flex align-items-center">
          <IonIcon 
            icon={getIcon()} 
            className="me-2" 
            style={{ fontSize: '1.2em' }}
          />
          <span className="flex-grow-1">{message}</span>
          <button 
            type="button" 
            className="btn-close btn-close-white ms-2" 
            onClick={onClose}
            aria-label="Close"
          />
        </div>
      </div>
    </div>
  )
}
