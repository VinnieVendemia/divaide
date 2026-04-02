import { Text } from 'ink';

type StatusType = 'info' | 'success' | 'warning' | 'error';

interface StatusMessageProps {
  type: StatusType;
  text: string;
}

const CONFIG: Record<StatusType, { color: string; icon: string }> = {
  info: { color: 'blue', icon: 'ℹ' },
  success: { color: 'green', icon: '✓' },
  warning: { color: 'yellow', icon: '⚠' },
  error: { color: 'red', icon: '✗' },
};

export function StatusMessage({ type, text }: StatusMessageProps) {
  const { color, icon } = CONFIG[type];
  return (
    <Text>
      <Text color={color}>{icon} </Text>
      {text}
    </Text>
  );
}
