import { Html5QrcodeScanner } from 'html5-qrcode';
import { useEffect } from 'react';

const Scanner = ({ onScanSuccess, onScanError }) => {
    useEffect(() => {
        const scanner = new Html5QrcodeScanner('reader', {
            qrbox: { width: 250, height: 250 },
            fps: 10,
        });

        scanner.render(onScanSuccess, onScanError);

        return () => scanner.clear(); // Cleanup on unmount
    }, []);

    return <div id="reader" style={{ width: '100%' }}></div>;
};

export default Scanner;