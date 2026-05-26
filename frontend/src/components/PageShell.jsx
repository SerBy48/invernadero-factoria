import { Box, Paper, Typography, Button } from '@mui/material';
import AddRoundedIcon from '@mui/icons-material/AddRounded';
import { useI18n } from '../i18n/useI18n';

export default function PageShell({ icon, entityKey, onNew, children }) {
  const { t } = useI18n();

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>
      {/* Gradient header card */}
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2.5, sm: 3 },
          mb: 3,
          background: theme =>
            `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          color: '#fff',
          borderRadius: 3,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ fontSize: { xs: 32, sm: 40 }, lineHeight: 1, opacity: 0.9 }}>{icon}</Box>
          <Box>
            <Typography variant="h5" fontWeight={700} sx={{ lineHeight: 1.2 }}>
              {t(`entidades.${entityKey}.titulo`)}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.82, mt: 0.4 }}>
              {t(`entidades.${entityKey}.descripcion`)}
            </Typography>
          </Box>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={onNew}
          sx={{
            bgcolor: 'rgba(255,255,255,0.95)',
            color: 'primary.dark',
            fontWeight: 700,
            '&:hover': { bgcolor: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
          }}
        >
          {t('acciones.nuevo')}
        </Button>
      </Paper>

      {children}
    </Box>
  );
}
