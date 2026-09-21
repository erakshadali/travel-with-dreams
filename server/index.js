import app from './app.js';
import { SITE } from '../src/config/site.js';

const PORT = Number(process.env.PORT) || 4000;

app.listen(PORT, () => {
  console.log(`${SITE.name} API listening on http://localhost:${PORT}`);
});
