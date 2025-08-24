import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { removeNotification } from '../store/slices/uiSlice';

const NotificationToast: React.FC = () => {
  const dispatch = useAppDispatch();
  const { notifications } = useAppSelector(state => state.ui);

  useEffect(() => {
    notifications.forEach(notification => {
      if (notification.duration && notification.duration > 0) {
        const timer = setTimeout(() => {
          dispatch(removeNotification(notification.id));
        }, notification.duration);

        return () => clearTimeout(timer);
      }
    });
  }, [notifications, dispatch]);

  if (notifications.length === 0) return null;

  const getTypeStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500 border-green-600 text-white';
      case 'error':
        return 'bg-red-500 border-red-600 text-white';
      case 'warning':
        return 'bg-yellow-500 border-yellow-600 text-black';
      case 'info':
        return 'bg-blue-500 border-blue-600 text-white';
      default:
        return 'bg-gray-500 border-gray-600 text-white';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'ℹ';
      default:
        return '•';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {notifications.map((notification) => (
        <div
          key={notification.id}
          className={`
            max-w-sm p-4 rounded-lg border-2 shadow-lg animate-slide-down
            ${getTypeStyles(notification.type)}
            transform transition-all duration-300 ease-in-out
          `}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3">
              <span className="text-lg font-bold flex-shrink-0">
                {getIcon(notification.type)}
              </span>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">
                  {notification.title}
                </h4>
                <p className="text-sm opacity-90">
                  {notification.message}
                </p>
                {notification.actions && notification.actions.length > 0 && (
                  <div className="mt-2 space-x-2">
                    {notification.actions.map((action, index) => (
                      <button
                        key={index}
                        onClick={action.action}
                        className={`
                          text-xs px-2 py-1 rounded border
                          ${action.primary 
                            ? 'bg-white text-gray-900 border-gray-300' 
                            : 'bg-transparent border-current hover:bg-white hover:bg-opacity-20'
                          }
                          transition-colors duration-200
                        `}
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <button
              onClick={() => dispatch(removeNotification(notification.id))}
              className="flex-shrink-0 ml-2 text-lg hover:opacity-75 transition-opacity"
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NotificationToast;
