import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Stack,
} from "@mui/material";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";

const techStack = [
  "Python",
  "FastAPI",
  "SQLAlchemy",
  "PostgreSQL",
  "Neon DB",
  "Next.js",
  "Material UI",
  "Vercel",
];

const features = [
  "Live PostgreSQL Integration",
  "Python FastAPI Backend",
  "SQLAlchemy Repository Pattern",
  "REST API Architecture",
  "Dynamic Data Loading",
  "Search & Sorting",
  "Pagination",
  "Responsive UI",
  "Cloud Deployment",
  "CSV Export Ready",
];

const roadmap = [
  "CSV Upload",
  "Pandas",
  "NumPy",
  "Scikit-Learn",
  "Machine Learning",
  "Salary Prediction",
  "AI Analytics",
  "RAG",
  "Agentic AI",
];

const architecture = [
  "PostgreSQL (Neon Database)",
  "Python + SQLAlchemy",
  "FastAPI REST APIs",
  "JSON Response",
  "Next.js Frontend",
  "Material UI Dashboard",
];

export default function PlatformOverview() {
  return (
    <>
      {/* Hero Section */}
      <Card
        sx={{
          mb: { xs: 2.5, md: 4 },
          borderRadius: 4,
          background: "linear-gradient(135deg,#1976d2,#42a5f5)",
          color: "white",
        }}
      >
        <CardContent sx={{ py: { xs: 3, sm: 4 }, px: { xs: 2.5, sm: 3 } }}>
          <Typography
            variant="h4"
            fontWeight="bold"
            gutterBottom
            sx={{ fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" } }}
          >
            Yuktishaalaa AI Data Platform
          </Typography>

          <Typography sx={{ fontSize: { xs: "0.9rem", sm: "1rem" }, opacity: 0.95, maxWidth: 640 }}>
            A modern full-stack analytics platform demonstrating Python, FastAPI,
            PostgreSQL, Next.js and cloud-native architecture.
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexWrap: "wrap",
              gap: 1,
              mt: { xs: 2, sm: 3 },
            }}
          >
            {techStack.map((tech) => (
              <Chip
                key={tech}
                label={tech}
                size="small"
                sx={{
                  bgcolor: "rgba(255,255,255,0.18)",
                  color: "white",
                  fontWeight: 500,
                }}
              />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card sx={{ mb: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <CardContent sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            How This Platform Works
          </Typography>

          <Typography color="text.secondary" sx={{ fontSize: { xs: "0.9rem", sm: "1rem" } }}>
            Employee information is stored in a PostgreSQL database hosted on Neon.
            Python FastAPI services retrieve the data through SQLAlchemy and expose
            REST APIs. Next.js consumes these APIs and dynamically renders employee
            analytics, search, sorting and pagination using live database records
            instead of static datasets.
          </Typography>
        </CardContent>
      </Card>

      {/* Architecture */}
      <Card sx={{ mb: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <CardContent sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Platform Architecture
          </Typography>

          {/* Horizontal flow on larger screens, vertical stack on mobile */}
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems="center"
            flexWrap="wrap"
            useFlexGap
            sx={{ mt: 1 }}
          >
            {architecture.map((step, i) => (
              <Box key={step} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Chip
                  label={step}
                  variant="outlined"
                  color="primary"
                  sx={{ fontWeight: 500 }}
                />
                {i < architecture.length - 1 && (
                  <ArrowDownwardIcon
                    color="primary"
                    fontSize="small"
                    sx={{
                      transform: { xs: "none", sm: "rotate(-90deg)" },
                    }}
                  />
                )}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Features */}
      <Card sx={{ mb: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <CardContent sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Current Features
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {features.map((item) => (
              <Chip key={item} label={item} color="primary" variant="outlined" size="small" />
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Future Roadmap */}
      <Card sx={{ mb: { xs: 2.5, md: 4 }, borderRadius: 4 }}>
        <CardContent sx={{ px: { xs: 2.5, sm: 3 } }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Future Roadmap
          </Typography>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
            {roadmap.map((item) => (
              <Chip key={item} label={item} size="small" variant="filled" color="secondary" />
            ))}
          </Box>
        </CardContent>
      </Card>
    </>
  );
}