import { Container, Grid, Skeleton, LinearProgress } from '@mui/material';

/**
 * Generic skeleton placeholder used while pages hydrate data.
 * Avoids showing circular spinners by keeping layout hints on screen.
 */
const PageLoader = ({ headingWidth = '35%', blocks = [], maxWidth = 'lg' }) => {
  const resolvedBlocks = blocks.length
    ? blocks
    : [
        { height: 220, xs: 12 },
        { height: 220, xs: 12 },
      ];

  return (
    <Container
      maxWidth={false}
      sx={{
        py: { xs: 1, sm: 2 },
        px: { xs: 1, sm: 3, md: 4, lg: 6, xl: 8 },
        maxWidth: {
          xs: '100%',
          sm: '100%',
          md: '100%',
          lg: maxWidth === 'lg' ? '1200px' : '1400px',
          xl: maxWidth === 'lg' ? '1400px' : '1600px',
        },
      }}
    >
      <LinearProgress sx={{ mb: 3 }} />
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Skeleton variant="text" height={48} width={headingWidth} />
        </Grid>
        {resolvedBlocks.map((block, index) => (
          <Grid
            item
            xs={block.xs ?? 12}
            md={block.md}
            lg={block.lg}
            key={`page-loader-${index}`}
          >
            <Skeleton
              variant={block.variant || 'rounded'}
              height={block.height || 280}
            />
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default PageLoader;
