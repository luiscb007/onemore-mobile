import React, { useState, useRef } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';

interface RangeSliderProps {
  min: number;
  max: number;
  low: number;
  high: number;
  step?: number;
  onValueChanged: (low: number, high: number) => void;
}

export const RangeSlider: React.FC<RangeSliderProps> = ({
  min,
  max,
  low,
  high,
  step = 1,
  onValueChanged,
}) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [sliderPageX, setSliderPageX] = useState(0);
  const [isDraggingLow, setIsDraggingLow] = useState(false);
  const [isDraggingHigh, setIsDraggingHigh] = useState(false);
  const sliderRef = useRef<View>(null);
  const lowStartX = useRef(0);
  const highStartX = useRef(0);

  const getValueFromPosition = (position: number): number => {
    if (sliderWidth === 0) return min;
    const percentage = Math.max(0, Math.min(1, position / sliderWidth));
    const value = min + percentage * (max - min);
    const steppedValue = Math.round(value / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  };

  const getPositionFromValue = (value: number): number => {
    const percentage = (value - min) / (max - min);
    return percentage * sliderWidth;
  };

  const lowPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setIsDraggingLow(true);
        lowStartX.current = gestureState.x0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const relativeX = gestureState.x0 - sliderPageX + gestureState.dx;
        const clampedX = Math.max(0, Math.min(sliderWidth, relativeX));
        const newValue = getValueFromPosition(clampedX);
        
        if (newValue <= high) {
          onValueChanged(newValue, high);
        }
      },
      onPanResponderRelease: () => {
        setIsDraggingLow(false);
      },
    })
  ).current;

  const highPanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (evt, gestureState) => {
        setIsDraggingHigh(true);
        highStartX.current = gestureState.x0;
      },
      onPanResponderMove: (evt, gestureState) => {
        const relativeX = gestureState.x0 - sliderPageX + gestureState.dx;
        const clampedX = Math.max(0, Math.min(sliderWidth, relativeX));
        const newValue = getValueFromPosition(clampedX);
        
        if (newValue >= low) {
          onValueChanged(low, newValue);
        }
      },
      onPanResponderRelease: () => {
        setIsDraggingHigh(false);
      },
    })
  ).current;

  const lowPos = getPositionFromValue(low);
  const highPos = getPositionFromValue(high);

  return (
    <View style={styles.container}>
      <View
        ref={sliderRef}
        style={styles.rail}
        onLayout={(event) => {
          const { width } = event.nativeEvent.layout;
          setSliderWidth(width);
          
          // Get absolute position on screen
          setTimeout(() => {
            sliderRef.current?.measure((fx, fy, w, h, px, py) => {
              setSliderPageX(px);
            });
          }, 100);
        }}
      >
        <View
          style={[
            styles.railSelected,
            {
              left: lowPos,
              width: highPos - lowPos,
            },
          ]}
        />
        <View
          {...lowPanResponder.panHandlers}
          style={[
            styles.thumb,
            {
              left: lowPos - 14,
              transform: [{ scale: isDraggingLow ? 1.2 : 1 }],
            },
          ]}
        />
        <View
          {...highPanResponder.panHandlers}
          style={[
            styles.thumb,
            {
              left: highPos - 14,
              transform: [{ scale: isDraggingHigh ? 1.2 : 1 }],
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 40,
    justifyContent: 'center',
  },
  rail: {
    height: 4,
    backgroundColor: '#cbd5e1',
    borderRadius: 2,
    position: 'relative',
  },
  railSelected: {
    position: 'absolute',
    height: 4,
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#007AFF',
    borderWidth: 3,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
    top: -12,
  },
});
