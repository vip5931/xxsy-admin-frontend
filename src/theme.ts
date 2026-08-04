import type { GlobalThemeOverrides } from 'naive-ui';

export const themeOverrides: GlobalThemeOverrides = {
  common: {
    primaryColor: '#1677ff',
    primaryColorHover: '#4096ff',
    primaryColorPressed: '#0958d9',
    primaryColorSuppl: '#4096ff',
    infoColor: '#1677ff',
    successColor: '#18a058',
    warningColor: '#f0a020',
    errorColor: '#d03050',
    borderRadius: '6px',
    borderRadiusSmall: '4px',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    textColorBase: '#1f2329',
  },
  Card: {
    borderRadius: '10px',
    borderColor: 'rgba(31, 35, 41, 0.08)',
    color: '#ffffff',
  },
  Table: {
    thColor: '#fafafa',
    tdColor: '#ffffff',
    borderColor: 'rgba(31, 35, 41, 0.08)',
    thFontWeight: '600',
    thTextColor: '#4e5969',
  },
  Button: {
    borderRadiusMedium: '6px',
    borderRadiusSmall: '4px',
  },
  Input: {
    borderRadius: '6px',
  },
  Select: {
    peers: {
      InternalSelection: {
        borderRadius: '6px',
      },
    },
  },
  Layout: {
    siderColor: '#001529',
    siderBorderColor: 'transparent',
  },
  Menu: {
    itemHeight: '44px',
    itemColorActiveInverted: 'rgba(255, 255, 255, 0.12)',
    itemColorActiveHoverInverted: 'rgba(255, 255, 255, 0.16)',
    itemColorHoverInverted: 'rgba(255, 255, 255, 0.06)',
    itemTextColorInverted: 'rgba(255, 255, 255, 0.68)',
    itemTextColorHoverInverted: '#ffffff',
    itemTextColorActiveInverted: '#ffffff',
    itemIconColorInverted: 'rgba(255, 255, 255, 0.68)',
    itemIconColorHoverInverted: '#ffffff',
    itemIconColorActiveInverted: '#ffffff',
    groupTextColorInverted: 'rgba(255, 255, 255, 0.38)',
  },
  Modal: {
    borderRadius: '12px',
  },
  Popover: {
    borderRadius: '8px',
  },
};
