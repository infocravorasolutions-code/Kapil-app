import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';
import Svg, { Path } from 'react-native-svg';

interface DigitalSignatureProps {
  onSignatureComplete: (signatureUri: string) => void;
  onCancel: () => void;
}

interface Point {
  x: number;
  y: number;
}

const DigitalSignature: React.FC<DigitalSignatureProps> = ({
  onSignatureComplete,
  onCancel,
}) => {
  const signatureRef = useRef<View>(null);
  const [paths, setPaths] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Point[]>([]);

  const handleTouchStart = (event: any) => {
    const { locationX, locationY } = event.nativeEvent;
    const newPoint = { x: locationX, y: locationY };
    setCurrentPath([newPoint]);
    setIsDrawing(true);
  };

  const handleTouchMove = (event: any) => {
    if (!isDrawing) return;
    const { locationX, locationY } = event.nativeEvent;
    const newPoint = { x: locationX, y: locationY };
    
    setCurrentPath(prev => [...prev, newPoint]);
  };

  const handleTouchEnd = () => {
    if (currentPath.length > 0) {
      setPaths(prev => [...prev, ...currentPath]);
    }
    setCurrentPath([]);
    setIsDrawing(false);
  };

  const clearSignature = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  const saveSignature = async () => {
    if (paths.length === 0) {
      Alert.alert('No Signature', 'Please draw your signature first');
      return;
    }

    try {
      const uri = await captureRef(signatureRef, {
        format: 'png',
        quality: 1,
      });
      onSignatureComplete(uri);
    } catch (error) {
      console.error('Error capturing signature:', error);
      Alert.alert('Error', 'Failed to save signature');
    }
  };

  const createPathData = (points: Point[]) => {
    if (points.length === 0) return '';
    if (points.length === 1) return `M${points[0].x},${points[0].y}`;
    
    let pathData = `M${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      pathData += ` L${points[i].x},${points[i].y}`;
    }
    return pathData;
  };

  const renderSignaturePath = () => {
    const allPoints = [...paths, ...currentPath];
    if (allPoints.length === 0) return null;
    
    return (
      <Svg height="100%" width="100%" style={styles.svg}>
        <Path
          d={createPathData(allPoints)}
          stroke="#000"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </Svg>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Digital Signature</Text>
        <Text style={styles.subtitle}>Draw your signature below</Text>
      </View>

      <View style={styles.signatureArea}>
        <View
          ref={signatureRef}
          style={styles.drawingArea}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {renderSignaturePath()}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.clearButton} onPress={clearSignature}>
          <Text style={styles.clearButtonText}>Clear</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveButton} onPress={saveSignature}>
          <Text style={styles.saveButtonText}>Save Signature</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  signatureArea: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    marginBottom: 20,
    position: 'relative',
  },
  drawingArea: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
  },
  clearButton: {
    flex: 1,
    backgroundColor: '#ff6b6b',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#6c757d',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#28a745',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DigitalSignature;
