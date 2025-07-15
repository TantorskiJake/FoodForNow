import React, { useEffect, useRef, useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Box, Typography, Alert } from '@mui/material';
import { BrowserMultiFormatReader } from '@zxing/browser';

const BarcodeScanner = ({ open, onDetected, onClose }) => {
  const videoRef = useRef(null);
  const codeReaderRef = useRef(null);
  const [error, setError] = useState(null);
  const [scanned, setScanned] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);

  useEffect(() => {
    if (!open) return;
    setError(null);
    setScanned(false);
    setCameraReady(false);
    codeReaderRef.current = new BrowserMultiFormatReader();
    let active = true;

    const startScanner = async () => {
      try {
        const videoInputDevices = await BrowserMultiFormatReader.listVideoInputDevices();
        if (!videoInputDevices.length) {
          setError('No camera devices found.');
          return;
        }
        const deviceId = videoInputDevices[0].deviceId;
        codeReaderRef.current.decodeFromVideoDevice(
          deviceId,
          videoRef.current,
          (result, err, controls) => {
            if (!active) return;
            if (result && !scanned) {
              setScanned(true);
              controls.stop();
              onDetected(result.getText());
            }
            // Only show errors that are not NotFoundException (which means no code found in frame)
            if (err && err.name !== 'NotFoundException') {
              setError(err.message || 'Camera error');
            }
            setCameraReady(true);
          }
        );
      } catch (e) {
        setError(e.message || 'Camera error');
      }
    };
    startScanner();
    return () => {
      active = false;
      try {
        codeReaderRef.current && codeReaderRef.current.reset();
      } catch {}
    };
  }, [open, onDetected, scanned]);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Scan Barcode</DialogTitle>
      <DialogContent>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
            <br />
            <strong>Troubleshooting:</strong>
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li>Allow camera access in your browser.</li>
              <li>Close other apps using the camera.</li>
              <li>Try a different browser (Chrome/Edge/Firefox/Safari).</li>
              <li>Refresh the page after changing permissions.</li>
            </ul>
          </Alert>
        )}
        <Box sx={{ width: '100%', height: 300, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', borderRadius: 2 }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} autoPlay muted playsInline />
        </Box>
        {!cameraReady && !error && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Waiting for camera...<br />
            If prompted, allow camera access.
          </Typography>
        )}
        <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
          Point your camera at a barcode or QR code.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">Close</Button>
      </DialogActions>
    </Dialog>
  );
};

export default BarcodeScanner; 