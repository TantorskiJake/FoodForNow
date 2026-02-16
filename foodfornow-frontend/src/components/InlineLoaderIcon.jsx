import { Box, LinearProgress } from '@mui/material';

const InlineLoaderIcon = ({ size = 20 }) => (
  <Box
    component="span"
    sx={{
      width: size + 4,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}
  >
    <LinearProgress
      sx={{
        width: size,
        height: Math.max(4, size / 5),
        borderRadius: 999,
      }}
    />
  </Box>
);

export default InlineLoaderIcon;
