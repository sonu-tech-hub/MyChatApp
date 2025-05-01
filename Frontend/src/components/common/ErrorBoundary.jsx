// client/src/components/common/ErrorBoundary.jsx
import React, { Component } from 'react';
import { HiExclamationCircle, HiRefresh } from 'react-icons/hi';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        this.setState({
            error: error,
            errorInfo: errorInfo
        });

        // Log error to monitoring service
        console.error('Error caught by ErrorBoundary:', error, errorInfo);

        // In production, send to error tracking service like Sentry
        if (process.env.NODE_ENV === 'production' && window.Sentry) {
            window.Sentry.captureException(error);
        }
    }

    handleReset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });

        // Attempt to recover by reloading the component
        this.props.onReset?.();
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center min-h-full p-4 bg-gray-50 text-center">
                    <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
                        <div className="flex justify-center mb-4">
                            <HiExclamationCircle className="w-16 h-16 text-red-500" />
                        </div>

                        <h2 className="text-xl font-bold text-gray-800 mb-2">
                            Something went wrong
                        </h2>

                        <p className="text-gray-600 mb-6">
                            We encountered an error while trying to display this content.
                            Please try refreshing the page.
                        </p>

                        <button
                            onClick={this.handleReset}
                            className="inline-flex items-center px-4 py-2 bg-blue-500 text-white font-semibold rounded-md shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-75"
                        >
                            <HiRefresh className="mr-2" />
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;