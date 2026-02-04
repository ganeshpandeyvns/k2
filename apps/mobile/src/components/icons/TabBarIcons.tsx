// ============================================================================
// Tab Bar Icons - Premium SVG Icons for Bottom Navigation
// ============================================================================

import React from 'react';
import Svg, { Path, Circle, Rect, G } from 'react-native-svg';
import { MeruTheme } from '../../theme/meru';

interface IconProps {
  size?: number;
  color?: string;
  focused?: boolean;
}

// Home Icon - Modern house with clean lines
export const HomeIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        // Filled version for active state
        <Path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          fill={activeColor}
        />
      ) : (
        // Outline version for inactive state
        <Path
          d="M3 10.5L12 3L21 10.5V20C21 20.5523 20.5523 21 20 21H15V15C15 14.4477 14.5523 14 14 14H10C9.44772 14 9 14.4477 9 15V21H4C3.44772 21 3 20.5523 3 20V10.5Z"
          stroke={activeColor}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </Svg>
  );
};

// Markets Icon - Graceful Rocket (growth/markets going up)
export const MarketsIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          {/* Rocket body */}
          <Path
            d="M12 2C12 2 8 6 8 12C8 15 9 17 10 19L12 22L14 19C15 17 16 15 16 12C16 6 12 2 12 2Z"
            fill={activeColor}
          />
          {/* Window */}
          <Circle cx="12" cy="10" r="2" fill={MeruTheme.colors.background.primary} />
          {/* Left fin */}
          <Path
            d="M8 14L5 17L8 16"
            fill={activeColor}
          />
          {/* Right fin */}
          <Path
            d="M16 14L19 17L16 16"
            fill={activeColor}
          />
        </G>
      ) : (
        <G>
          {/* Rocket body outline */}
          <Path
            d="M12 2C12 2 8 6 8 12C8 15 9 17 10 19L12 22L14 19C15 17 16 15 16 12C16 6 12 2 12 2Z"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Window */}
          <Circle cx="12" cy="10" r="2" stroke={activeColor} strokeWidth={1.5} />
          {/* Left fin */}
          <Path
            d="M8 14L5 17L8 16"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Right fin */}
          <Path
            d="M16 14L19 17L16 16"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
    </Svg>
  );
};

// Portfolio Icon - Wallet/briefcase style
export const PortfolioIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          <Path
            d="M19 7H5C3.89543 7 3 7.89543 3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9C21 7.89543 20.1046 7 19 7Z"
            fill={activeColor}
          />
          <Path
            d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"
            stroke={activeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="14" r="2" fill={MeruTheme.colors.background.primary} />
        </G>
      ) : (
        <G>
          <Path
            d="M19 7H5C3.89543 7 3 7.89543 3 9V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V9C21 7.89543 20.1046 7 19 7Z"
            stroke={activeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Path
            d="M16 7V5C16 3.89543 15.1046 3 14 3H10C8.89543 3 8 3.89543 8 5V7"
            stroke={activeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Circle cx="12" cy="14" r="2" stroke={activeColor} strokeWidth={2} />
        </G>
      )}
    </Svg>
  );
};

// Settings Icon - Gear with clean design
export const SettingsIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          <Path
            d="M12 15C13.6569 15 15 13.6569 15 12C15 10.3431 13.6569 9 12 9C10.3431 9 9 10.3431 9 12C9 13.6569 10.3431 15 12 15Z"
            fill={MeruTheme.colors.background.primary}
          />
          <Path
            d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
            fill={activeColor}
          />
        </G>
      ) : (
        <G>
          <Circle
            cx="12" cy="12" r="3"
            stroke={activeColor}
            strokeWidth={2}
          />
          <Path
            d="M19.4 15C19.2669 15.3016 19.2272 15.6362 19.286 15.9606C19.3448 16.285 19.4995 16.5843 19.73 16.82L19.79 16.88C19.976 17.0657 20.1235 17.2863 20.2241 17.5291C20.3248 17.7719 20.3766 18.0322 20.3766 18.295C20.3766 18.5578 20.3248 18.8181 20.2241 19.0609C20.1235 19.3037 19.976 19.5243 19.79 19.71C19.6043 19.896 19.3837 20.0435 19.1409 20.1441C18.8981 20.2448 18.6378 20.2966 18.375 20.2966C18.1122 20.2966 17.8519 20.2448 17.6091 20.1441C17.3663 20.0435 17.1457 19.896 16.96 19.71L16.9 19.65C16.6643 19.4195 16.365 19.2648 16.0406 19.206C15.7162 19.1472 15.3816 19.1869 15.08 19.32C14.7842 19.4468 14.532 19.6572 14.3543 19.9255C14.1766 20.1938 14.0813 20.5082 14.08 20.83V21C14.08 21.5304 13.8693 22.0391 13.4942 22.4142C13.1191 22.7893 12.6104 23 12.08 23C11.5496 23 11.0409 22.7893 10.6658 22.4142C10.2907 22.0391 10.08 21.5304 10.08 21V20.91C10.0723 20.579 9.96512 20.258 9.77251 19.9887C9.5799 19.7194 9.31074 19.5143 9 19.4C8.69838 19.2669 8.36381 19.2272 8.03941 19.286C7.71502 19.3448 7.41568 19.4995 7.18 19.73L7.12 19.79C6.93425 19.976 6.71368 20.1235 6.47088 20.2241C6.22808 20.3248 5.96783 20.3766 5.705 20.3766C5.44217 20.3766 5.18192 20.3248 4.93912 20.2241C4.69632 20.1235 4.47575 19.976 4.29 19.79C4.10405 19.6043 3.95653 19.3837 3.85588 19.1409C3.75523 18.8981 3.70343 18.6378 3.70343 18.375C3.70343 18.1122 3.75523 17.8519 3.85588 17.6091C3.95653 17.3663 4.10405 17.1457 4.29 16.96L4.35 16.9C4.58054 16.6643 4.73519 16.365 4.794 16.0406C4.85282 15.7162 4.81312 15.3816 4.68 15.08C4.55324 14.7842 4.34276 14.532 4.07447 14.3543C3.80618 14.1766 3.49179 14.0813 3.17 14.08H3C2.46957 14.08 1.96086 13.8693 1.58579 13.4942C1.21071 13.1191 1 12.6104 1 12.08C1 11.5496 1.21071 11.0409 1.58579 10.6658C1.96086 10.2907 2.46957 10.08 3 10.08H3.09C3.42099 10.0723 3.742 9.96512 4.0113 9.77251C4.28059 9.5799 4.48572 9.31074 4.6 9C4.73312 8.69838 4.77282 8.36381 4.714 8.03941C4.65519 7.71502 4.50054 7.41568 4.27 7.18L4.21 7.12C4.02405 6.93425 3.87653 6.71368 3.77588 6.47088C3.67523 6.22808 3.62343 5.96783 3.62343 5.705C3.62343 5.44217 3.67523 5.18192 3.77588 4.93912C3.87653 4.69632 4.02405 4.47575 4.21 4.29C4.39575 4.10405 4.61632 3.95653 4.85912 3.85588C5.10192 3.75523 5.36217 3.70343 5.625 3.70343C5.88783 3.70343 6.14808 3.75523 6.39088 3.85588C6.63368 3.95653 6.85425 4.10405 7.04 4.29L7.1 4.35C7.33568 4.58054 7.63502 4.73519 7.95941 4.794C8.28381 4.85282 8.61838 4.81312 8.92 4.68H9C9.29577 4.55324 9.54802 4.34276 9.72569 4.07447C9.90337 3.80618 9.99872 3.49179 10 3.17V3C10 2.46957 10.2107 1.96086 10.5858 1.58579C10.9609 1.21071 11.4696 1 12 1C12.5304 1 13.0391 1.21071 13.4142 1.58579C13.7893 1.96086 14 2.46957 14 3V3.09C14.0013 3.41179 14.0966 3.72618 14.2743 3.99447C14.452 4.26276 14.7042 4.47324 15 4.6C15.3016 4.73312 15.6362 4.77282 15.9606 4.714C16.285 4.65519 16.5843 4.50054 16.82 4.27L16.88 4.21C17.0657 4.02405 17.2863 3.87653 17.5291 3.77588C17.7719 3.67523 18.0322 3.62343 18.295 3.62343C18.5578 3.62343 18.8181 3.67523 19.0609 3.77588C19.3037 3.87653 19.5243 4.02405 19.71 4.21C19.896 4.39575 20.0435 4.61632 20.1441 4.85912C20.2448 5.10192 20.2966 5.36217 20.2966 5.625C20.2966 5.88783 20.2448 6.14808 20.1441 6.39088C20.0435 6.63368 19.896 6.85425 19.71 7.04L19.65 7.1C19.4195 7.33568 19.2648 7.63502 19.206 7.95941C19.1472 8.28381 19.1869 8.61838 19.32 8.92V9C19.4468 9.29577 19.6572 9.54802 19.9255 9.72569C20.1938 9.90337 20.5082 9.99872 20.83 10H21C21.5304 10 22.0391 10.2107 22.4142 10.5858C22.7893 10.9609 23 11.4696 23 12C23 12.5304 22.7893 13.0391 22.4142 13.4142C22.0391 13.7893 21.5304 14 21 14H20.91C20.5882 14.0013 20.2738 14.0966 20.0055 14.2743C19.7372 14.452 19.5268 14.7042 19.4 15Z"
            stroke={activeColor}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
    </Svg>
  );
};

// Quick Action Icons

export const DepositIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.accent.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4V20M12 20L6 14M12 20L18 14"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const WithdrawIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.accent.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 20V4M12 4L6 10M12 4L18 10"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SwapIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.accent.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M7 10L3 6M3 6L7 2M3 6H16C17.0609 6 18.0783 6.42143 18.8284 7.17157C19.5786 7.92172 20 8.93913 20 10"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M17 14L21 18M21 18L17 22M21 18H8C6.93913 18 5.92172 17.5786 5.17157 16.8284C4.42143 16.0783 4 15.0609 4 14"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const SendIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.accent.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M5 12H19M19 12L13 6M19 12L13 18"
      stroke={color}
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Notification Bell Icon
export const BellIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M13.73 21C13.5542 21.3031 13.3019 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// ============================================================================
// Markets Screen Tab Icons - Premium SVG for Crypto/Events/Trending
// ============================================================================

// Crypto Icon - Bitcoin-inspired stylized 'B' with circle
export const CryptoIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          <Circle cx="12" cy="12" r="10" fill={activeColor} />
          <Path
            d="M9.5 7V17M9.5 7H13C14.6569 7 16 8.11929 16 9.5C16 10.8807 14.6569 12 13 12M9.5 7H8M9.5 12H14C15.6569 12 17 13.1193 17 14.5C17 15.8807 15.6569 17 14 17H9.5M9.5 12V17M9.5 17H8M11 5V7M11 17V19M13 5V7M13 17V19"
            stroke={MeruTheme.colors.background.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      ) : (
        <G>
          <Circle cx="12" cy="12" r="10" stroke={activeColor} strokeWidth={1.5} />
          <Path
            d="M9.5 7V17M9.5 7H13C14.6569 7 16 8.11929 16 9.5C16 10.8807 14.6569 12 13 12M9.5 7H8M9.5 12H14C15.6569 12 17 13.1193 17 14.5C17 15.8807 15.6569 17 14 17H9.5M9.5 12V17M9.5 17H8M11 5V7M11 17V19M13 5V7M13 17V19"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
    </Svg>
  );
};

// Events Icon - Calendar with checkmark (prediction markets)
export const EventsIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          <Rect x="3" y="4" width="18" height="18" rx="3" fill={activeColor} />
          <Path
            d="M8 2V6M16 2V6M3 10H21"
            stroke={activeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          <Path
            d="M9 15L11 17L15 13"
            stroke={MeruTheme.colors.background.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      ) : (
        <G>
          <Rect
            x="3" y="4" width="18" height="18" rx="3"
            stroke={activeColor}
            strokeWidth={1.5}
          />
          <Path
            d="M8 2V6M16 2V6M3 10H21"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          <Path
            d="M9 15L11 17L15 13"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
    </Svg>
  );
};

// Trending Icon - Rising flame / rocket
export const TrendingIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <Path
          d="M12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2ZM12 18C10.3431 18 9 16.6569 9 15C9 13.3431 10.3431 12 12 12C13.6569 12 15 13.3431 15 15C15 16.6569 13.6569 18 12 18Z"
          fill={activeColor}
        />
      ) : (
        <G>
          <Path
            d="M12 2C12 2 4 8 4 14C4 18.4183 7.58172 22 12 22C16.4183 22 20 18.4183 20 14C20 8 12 2 12 2Z"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle
            cx="12" cy="15" r="3"
            stroke={activeColor}
            strokeWidth={1.5}
          />
        </G>
      )}
    </Svg>
  );
};

// Stocks Icon - Bar chart / candlestick style
export const StocksIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          {/* Candlestick bars */}
          <Rect x="4" y="8" width="4" height="10" rx="1" fill={activeColor} />
          <Rect x="10" y="4" width="4" height="14" rx="1" fill={activeColor} />
          <Rect x="16" y="10" width="4" height="8" rx="1" fill={activeColor} />
          {/* Wicks */}
          <Path d="M6 6V8M6 18V20" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M12 2V4M12 18V22" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M18 8V10M18 18V20" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" />
        </G>
      ) : (
        <G>
          {/* Candlestick bars outline */}
          <Rect x="4" y="8" width="4" height="10" rx="1" stroke={activeColor} strokeWidth={1.5} />
          <Rect x="10" y="4" width="4" height="14" rx="1" stroke={activeColor} strokeWidth={1.5} />
          <Rect x="16" y="10" width="4" height="8" rx="1" stroke={activeColor} strokeWidth={1.5} />
          {/* Wicks */}
          <Path d="M6 6V8M6 18V20" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M12 2V4M12 18V22" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" />
          <Path d="M18 8V10M18 18V20" stroke={activeColor} strokeWidth={1.5} strokeLinecap="round" />
        </G>
      )}
    </Svg>
  );
};

// Search Icon - Clean magnifying glass
export const SearchIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="7" stroke={color} strokeWidth={2} />
    <Path
      d="M21 21L16.5 16.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
  </Svg>
);

// Filter/Settings Icon - Sliders
export const FilterIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M4 21V14M4 10V3M12 21V12M12 8V3M20 21V16M20 12V3M1 14H7M9 8H15M17 16H23"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Theme Icons for Settings
export const PaletteIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C12.83 22 13.5 21.33 13.5 20.5C13.5 20.12 13.36 19.77 13.13 19.51C12.9 19.25 12.77 18.92 12.77 18.55C12.77 17.75 13.43 17.09 14.23 17.09H16C18.76 17.09 21 14.85 21 12.09C21 6.53 17.04 2 12 2Z"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx="6.5" cy="11.5" r="1.5" fill={color} />
    <Circle cx="9.5" cy="7.5" r="1.5" fill={color} />
    <Circle cx="14.5" cy="7.5" r="1.5" fill={color} />
    <Circle cx="17.5" cy="11.5" r="1.5" fill={color} />
  </Svg>
);

// Check Icon for theme selection
export const CheckIcon: React.FC<IconProps> = ({
  size = 20,
  color = MeruTheme.colors.accent.primary,
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 6L9 17L4 12"
      stroke={color}
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// RWA (Real World Assets) Icon - Building with coin/token overlay
export const RWAIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          {/* Building base */}
          <Path
            d="M3 21H21"
            stroke={activeColor}
            strokeWidth={2}
            strokeLinecap="round"
          />
          {/* Building structure */}
          <Path
            d="M5 21V8L12 3L19 8V21"
            fill={activeColor}
          />
          {/* Windows */}
          <Rect x="8" y="11" width="3" height="3" rx="0.5" fill={MeruTheme.colors.background.primary} />
          <Rect x="13" y="11" width="3" height="3" rx="0.5" fill={MeruTheme.colors.background.primary} />
          <Rect x="8" y="16" width="3" height="5" rx="0.5" fill={MeruTheme.colors.background.primary} />
          <Rect x="13" y="16" width="3" height="5" rx="0.5" fill={MeruTheme.colors.background.primary} />
          {/* Token/coin overlay */}
          <Circle cx="18" cy="7" r="4" fill={activeColor} stroke={MeruTheme.colors.background.primary} strokeWidth={1.5} />
          <Path
            d="M18 5V9M16.5 7H19.5"
            stroke={MeruTheme.colors.background.primary}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </G>
      ) : (
        <G>
          {/* Building base */}
          <Path
            d="M3 21H21"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Building structure */}
          <Path
            d="M5 21V8L12 3L19 8V21"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Windows */}
          <Rect x="8" y="11" width="3" height="3" rx="0.5" stroke={activeColor} strokeWidth={1} />
          <Rect x="13" y="11" width="3" height="3" rx="0.5" stroke={activeColor} strokeWidth={1} />
          <Rect x="8" y="16" width="3" height="5" rx="0.5" stroke={activeColor} strokeWidth={1} />
          <Rect x="13" y="16" width="3" height="5" rx="0.5" stroke={activeColor} strokeWidth={1} />
          {/* Token/coin overlay */}
          <Circle cx="18" cy="7" r="4" stroke={activeColor} strokeWidth={1.5} />
          <Path
            d="M18 5V9M16.5 7H19.5"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </G>
      )}
    </Svg>
  );
};

// Options Icon - Chart with call/put arrows
export const OptionsIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          {/* Base chart area */}
          <Rect x="3" y="3" width="18" height="18" rx="2" fill={activeColor} />
          {/* Up arrow (call) */}
          <Path
            d="M8 16V10M8 10L5 13M8 10L11 13"
            stroke={MeruTheme.colors.background.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Down arrow (put) */}
          <Path
            d="M16 8V14M16 14L13 11M16 14L19 11"
            stroke={MeruTheme.colors.background.primary}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      ) : (
        <G>
          {/* Base chart area */}
          <Rect x="3" y="3" width="18" height="18" rx="2" stroke={activeColor} strokeWidth={1.5} />
          {/* Up arrow (call) */}
          <Path
            d="M8 16V10M8 10L5 13M8 10L11 13"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Down arrow (put) */}
          <Path
            d="M16 8V14M16 14L13 11M16 14L19 11"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </G>
      )}
    </Svg>
  );
};

// Private Stocks Icon - Lock with chart (exclusive/private investment)
export const PrivateIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          {/* Lock body */}
          <Rect x="4" y="10" width="16" height="12" rx="2" fill={activeColor} />
          {/* Lock shackle */}
          <Path
            d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10"
            stroke={activeColor}
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          {/* Star/diamond inside (exclusive) */}
          <Path
            d="M12 13L13 15.5L15.5 16L13 16.5L12 19L11 16.5L8.5 16L11 15.5L12 13Z"
            fill={MeruTheme.colors.background.primary}
          />
        </G>
      ) : (
        <G>
          {/* Lock body outline */}
          <Rect
            x="4" y="10" width="16" height="12" rx="2"
            stroke={activeColor}
            strokeWidth={1.5}
          />
          {/* Lock shackle */}
          <Path
            d="M8 10V7C8 4.79086 9.79086 3 12 3C14.2091 3 16 4.79086 16 7V10"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
          {/* Star/diamond inside (exclusive) */}
          <Path
            d="M12 13L13 15.5L15.5 16L13 16.5L12 19L11 16.5L8.5 16L11 15.5L12 13Z"
            stroke={activeColor}
            strokeWidth={1}
            fill="none"
          />
        </G>
      )}
    </Svg>
  );
};

// Fixed Income / Bond Icon - Certificate with percent symbol
export const BondIcon: React.FC<IconProps> = ({
  size = 18,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {focused ? (
        <G>
          {/* Certificate body */}
          <Path
            d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H14L12 22L10 20H6C4.89543 20 4 19.1046 4 18V4Z"
            fill={activeColor}
          />
          {/* Percent symbol top circle */}
          <Circle cx="9" cy="9" r="2" fill={MeruTheme.colors.background.primary} />
          {/* Percent symbol bottom circle */}
          <Circle cx="15" cy="15" r="2" fill={MeruTheme.colors.background.primary} />
          {/* Percent diagonal line */}
          <Path
            d="M16 8L8 16"
            stroke={MeruTheme.colors.background.primary}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </G>
      ) : (
        <G>
          {/* Certificate body outline */}
          <Path
            d="M4 4C4 2.89543 4.89543 2 6 2H18C19.1046 2 20 2.89543 20 4V18C20 19.1046 19.1046 20 18 20H14L12 22L10 20H6C4.89543 20 4 19.1046 4 18V4Z"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Percent symbol top circle */}
          <Circle cx="9" cy="9" r="2" stroke={activeColor} strokeWidth={1.5} />
          {/* Percent symbol bottom circle */}
          <Circle cx="15" cy="15" r="2" stroke={activeColor} strokeWidth={1.5} />
          {/* Percent diagonal line */}
          <Path
            d="M16 8L8 16"
            stroke={activeColor}
            strokeWidth={1.5}
            strokeLinecap="round"
          />
        </G>
      )}
    </Svg>
  );
};

// AI Advisor Icon - AI Sparkles/Stars (common AI indicator)
export const AdvisorIcon: React.FC<IconProps> = ({
  size = 24,
  color = MeruTheme.colors.text.tertiary,
  focused = false,
}) => {
  const activeColor = focused ? MeruTheme.colors.accent.primary : color;

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Large 4-pointed star */}
      <Path
        d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z"
        fill={focused ? activeColor : 'none'}
        stroke={activeColor}
        strokeWidth={focused ? 0 : 1.5}
        strokeLinejoin="round"
      />
      {/* Small 4-pointed star (top right) */}
      <Path
        d="M19 2L19.75 4.25L22 5L19.75 5.75L19 8L18.25 5.75L16 5L18.25 4.25L19 2Z"
        fill={activeColor}
      />
      {/* Small 4-pointed star (bottom right) */}
      <Path
        d="M19 16L19.5 17.5L21 18L19.5 18.5L19 20L18.5 18.5L17 18L18.5 17.5L19 16Z"
        fill={activeColor}
      />
    </Svg>
  );
};
