const http = require('http');
const url = require('url');

const PORT = 3000;

// Simple cache to reduce OpenSky API calls (they rate-limit heavily)
const cache = new Map();
const CACHE_TTL = 30000; // 30 seconds

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCached(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

const AIRLINE_PREFIXES = {
  'UAL': { name: 'United Airlines', country: 'US' },
  'AAL': { name: 'American Airlines', country: 'US' },
  'DAL': { name: 'Delta Air Lines', country: 'US' },
  'SWA': { name: 'Southwest Airlines', country: 'US' },
  'JBU': { name: 'JetBlue Airways', country: 'US' },
  'ASA': { name: 'Alaska Airlines', country: 'US' },
  'FFT': { name: 'Frontier Airlines', country: 'US' },
  'BAW': { name: 'British Airways', country: 'GB' },
  'AFR': { name: 'Air France', country: 'FR' },
  'DLH': { name: 'Lufthansa', country: 'DE' },
  'EWG': { name: 'Eurowings', country: 'DE' },
  'SAS': { name: 'SAS Scandinavian Airlines', country: 'SE' },
  'KLM': { name: 'KLM Royal Dutch Airlines', country: 'NL' },
  'AFL': { name: 'Aeroflot', country: 'RU' },
  'IBE': { name: 'Iberia', country: 'ES' },
  'VLG': { name: 'Vueling', country: 'ES' },
  'RYR': { name: 'Ryanair', country: 'IE' },
  'EZY': { name: 'EasyJet', country: 'GB' },
  'ANA': { name: 'All Nippon Airways', country: 'JP' },
  'JAL': { name: 'Japan Airlines', country: 'JP' },
  'CPA': { name: 'Cathay Pacific', country: 'HK' },
  'CCA': { name: 'Air China', country: 'CN' },
  'CES': { name: 'China Eastern Airlines', country: 'CN' },
  'CSN': { name: 'China Southern Airlines', country: 'CN' },
  'AIC': { name: 'Air India', country: 'IN' },
  'IGO': { name: 'IndiGo', country: 'IN' },
  'QTR': { name: 'Qatar Airways', country: 'QA' },
  'UAE': { name: 'Emirates', country: 'AE' },
  'ETD': { name: 'Etihad Airways', country: 'AE' },
  'SIA': { name: 'Singapore Airlines', country: 'SG' },
  'TGW': { name: 'Scoot', country: 'SG' },
  'KAL': { name: 'Korean Air', country: 'KR' },
  'AAR': { name: 'Asiana Airlines', country: 'KR' },
  'THA': { name: 'Thai Airways', country: 'TH' },
  'MAS': { name: 'Malaysia Airlines', country: 'MY' },
  'GLO': { name: 'Gol Linhas Aereas', country: 'BR' },
  'LAT': { name: 'LATAM Chile', country: 'CL' },
  'ARG': { name: 'Aerolineas Argentinas', country: 'AR' },
  'UPS': { name: 'UPS Airlines', country: 'US' },
  'FDX': { name: 'FedEx', country: 'US' },
  'ABX': { name: 'Air Transport Services', country: 'US' },
  'GTI': { name: 'Atlas Air', country: 'US' },
  'FAB': { name: 'Antonov Airlines', country: 'UA' },
  'VOZ': { name: 'Virgin Australia', country: 'AU' },
  'QFA': { name: 'Qantas', country: 'AU' },
  'ANZ': { name: 'Air New Zealand', country: 'NZ' },
  'HAL': { name: 'Hawaiian Airlines', country: 'US' },
  'SKW': { name: 'SkyWest Airlines', country: 'US' },
  'RPA': { name: 'Republic Airways', country: 'US' },
  'ASH': { name: 'AirShare', country: 'US' },
  'FFT': { name: 'Frontier Airlines', country: 'US' },
  'NKS': { name: 'Spirit Airlines', country: 'US' },
  'SCX': { name: 'Sun Country Airlines', country: 'US' },
  'LYM': { name: 'Air Choice One', country: 'US' },
  'CAI': { name: 'Air Cairo', country: 'EG' },
  'MSR': { name: 'EgyptAir', country: 'EG' },
  'RAM': { name: 'Royal Air Maroc', country: 'MA' },
  'SVA': { name: 'Saudi Arabian Airlines', country: 'SA' },
  'KNE': { name: 'SaudiGulf Airlines', country: 'SA' },
  'OMA': { name: 'Oman Air', country: 'OM' },
  'GFA': { name: 'Gulf Air', country: 'BH' },
  'TAR': { name: 'Tunisair', country: 'TN' },
  'BRU': { name: 'Brussels Airlines', country: 'BE' },
  'BEL': { name: 'Brussels Airlines', country: 'BE' },
  'AUA': { name: 'Austrian Airlines', country: 'AT' },
  'DLM': { name: 'Danish Air Transport', country: 'DK' },
  'BTI': { name: 'AirBaltic', country: 'LV' },
  'FIN': { name: 'Finnair', country: 'FI' },
  'WZZ': { name: 'Wizz Air', country: 'HU' },
  'LOF': { name: 'Trans States Airlines', country: 'US' },
  'RJA': { name: 'Royal Jordanian', country: 'JO' },
  'KAC': { name: 'Kuwait Airways', country: 'KW' },
  'IRU': { name: 'Iran Air', country: 'IR' },
  'ICB': { name: 'Iraqi Airways', country: 'IQ' },
  'MAH': { name: 'Air Hungary', country: 'HU' },
  'LOT': { name: 'Polish Airlines', country: 'PL' },
  'OAL': { name: 'Olympic Air', country: 'GR' },
  'AEE': { name: 'Aegean Airlines', country: 'GR' },
  'CYP': { name: 'Cyprus Airways', country: 'CY' },
  'THY': { name: 'Turkish Airlines', country: 'TR' },
  'PGT': { name: 'Pegasus Airlines', country: 'TR' },
  'FDB': { name: 'Fly Dubai', country: 'AE' },
  'GIA': { name: 'Garuda Indonesia', country: 'ID' },
  'LNI': { name: 'Lion Air', country: 'ID' },
  'CTV': { name: 'Citilink', country: 'ID' },
  'WON': { name: 'Wings Air', country: 'ID' },
  'SJT': { name: 'Sriwijaya Air', country: 'ID' },
  'BKP': { name: 'Bangkok Airways', country: 'TH' },
  'AIJ': { name: 'Interjet', country: 'MX' },
  'AMX': { name: 'Aeromexico', country: 'MX' },
  'VOL': { name: 'Volaris', country: 'MX' },
  'VIV': { name: 'Viva Aerobus', country: 'MX' },
  'ACA': { name: 'Air Canada', country: 'CA' },
  'WJA': { name: 'WestJet', country: 'CA' },
  ' Jazz': { name: 'Air Canada Jazz', country: 'CA' },
  'CDG': { name: 'Air Canada Jetz', country: 'CA' },
  'ROU': { name: 'Air Canada Rouge', country: 'CA' },
  'SLM': { name: 'Surinam Airways', country: 'SR' },
  'ANG': { name: 'Air Niugini', country: 'PG' },
  'SEY': { name: 'Air Seychelles', country: 'SC' },
  'SAF': { name: 'South African Airways', country: 'ZA' },
  'KQA': { name: 'Kenya Airways', country: 'KE' },
  'ETH': { name: 'Ethiopian Airlines', country: 'ET' },
  'RWD': { name: 'RwandAir', country: 'RW' },
  'EUN': { name: 'Air Liberia', country: 'LR' },
  'KLM': { name: 'KLM', country: 'NL' },
  'TRA': { name: 'Transavia', country: 'NL' },
  'JAF': { name: 'TUI Airlines Belgium', country: 'BE' },
  'TUI': { name: 'TUI Airways', country: 'GB' },
  'TOM': { name: 'TUI Airways', country: 'GB' },
  'EXS': { name: 'Jet2.com', country: 'GB' },
  'LOG': { name: 'Loganair', country: 'GB' },
  'BCI': { name: 'Blue Islands', country: 'GG' },
  'ELY': { name: 'El Al', country: 'IL' },
  'AAD': { name: 'Air Senegal', country: 'SN' },
  'CRL': { name: 'Air Carriers', country: 'US' },
  'CKS': { name: 'Kalitta Air', country: 'US' },
  'ATN': { name: 'Air Transport', country: 'US' },
  'NCA': { name: 'Nippon Cargo Airlines', country: 'JP' },
  'CLU': { name: 'Cargojet', country: 'CA' },
  'DHK': { name: 'Aerologic', country: 'DE' },
  'BOX': { name: 'Cargo Logic Germany', country: 'DE' },
  'ICI': { name: 'Icelandic Cargo', country: 'IS' },
  'KRI': { name: 'KLM Cargo', country: 'NL' },
  'VDA': { name: 'Volga-Dnepr Airlines', country: 'RU' },
  'SBI': { name: 'Siber Airlines', country: 'RU' },
  'GAI': { name: 'Gromov Air', country: 'RU' },
  'TFU': { name: 'Gromov Air', country: 'RU' },
  'AUI': { name: 'Ukraine International', country: 'UA' },
  'BVS': { name: 'Air France Cargo', country: 'FR' },
  'DXH': { name: 'Dubai Air', country: 'AE' },
  'BAX': { name: 'Yangtze River Express', country: 'CN' },
  'XMN': { name: 'Air China Cargo', country: 'CN' },
  'CHH': { name: 'Hainan Airlines', country: 'CN' },
  'CDC': { name: 'XiamenAir', country: 'CN' },
  'CSC': { name: 'Sichuan Airlines', country: 'CN' },
  'CSH': { name: 'Shanghai Airlines', country: 'CN' },
  'CUA': { name: 'China United', country: 'CN' },
  'DKH': { name: 'Juneyao Airlines', country: 'CN' },
  'JJP': { name: 'Juneyao Airlines', country: 'CN' },
  'GCR': { name: 'Air Congo', country: 'CG' },
  'CGE': { name: 'Chengdu Airlines', country: 'CN' },
  'LZE': { name: 'Lanmei Airlines', country: 'KH' },
  'LKO': { name: 'Lao Airlines', country: 'LA' },
  'KOS': { name: 'Cambodia Airways', country: 'KH' },
  'RTM': { name: 'Air Amsterdam', country: 'NL' },
  'TGH': { name: 'Tajik Air', country: 'TJ' },
  'SZR': { name: 'Silkway Airlines', country: 'AZ' },
  'KGZ': { name: 'Air Kyrgyz', country: 'KG' },
  'NTH': { name: 'Vostok Airlines', country: 'RU' },
  'ABW': { name: 'Air Busan', country: 'KR' },
  'ABL': { name: 'Air Seoul', country: 'KR' },
  'JEA': { name: 'Jeju Air', country: 'KR' },
  'TNA': { name: 'Transavia France', country: 'FR' },
  'TVF': { name: 'Transavia France', country: 'FR' },
  'AEH': { name: 'Aeroxygen', country: 'FR' },
  'AUR': { name: 'Aurigny Air', country: 'GG' },
  'CIA': { name: 'Air Inter', country: 'FR' },
  'BEL': { name: 'Brussels Airlines', country: 'BE' },
  'DLA': { name: 'Air Liberte', country: 'FR' },
  'FTI': { name: 'Air France', country: 'FR' },
  'RUK': { name: 'Royal Flight', country: 'OM' },
  'UIU': { name: 'Air Ukraine', country: 'UA' },
  'LID': { name: 'Alitalia', country: 'IT' },
  'ITY': { name: 'Air Italy', country: 'IT' },
  'ISS': { name: 'Air Italy', country: 'IT' },
  'BIA': { name: 'Blue Panorama', country: 'IT' },
  'ADR': { name: 'Air Europa', country: 'ES' },
  'BIR': { name: 'Binter Canarias', country: 'ES' },
  'GCI': { name: 'Air Guanches', country: 'ES' },
  'MDI': { name: 'Mediterranean Air', country: 'GR' },
  'JDI': { name: 'Jettime', country: 'DK' },
  'NPT': { name: 'West Atlantic', country: 'SE' },
  'BCY': { name: 'CityJet', country: 'IE' },
  'AUR': { name: 'Aurigny', country: 'GG' },
  'IOS': { name: 'Isles of Scilly', country: 'GB' },
  'IMR': { name: 'Air Europe', country: 'ES' },
  'LHA': { name: 'Lufthansa Cargo', country: 'DE' },
  'GER': { name: 'German Airways', country: 'DE' },
  'CLH': { name: 'Lufthansa CityLine', country: 'DE' },
  'GEC': { name: 'Germanwings', country: 'DE' },
  'EWL': { name: 'Eurowings Europe', country: 'HR' },
  'EJU': { name: 'EasyJet Switzerland', country: 'CH' },
  'EZS': { name: 'EasyJet Switzerland', country: 'CH' },
  'CDS': { name: 'Air Tahiti Nui', country: 'PF' },
  'STA': { name: 'Air Tahiti', country: 'PF' },
  'PYR': { name: 'Pyramid Airlines', country: 'EG' },
  'KRT': { name: 'Kufra', country: 'LY' },
  'LBY': { name: 'Libyan Airlines', country: 'LY' },
  'LLM': { name: 'Air India', country: 'IN' },
  'GOZ': { name: 'GoAir', country: 'IN' },
  'SEZ': { name: 'SpiceJet', country: 'IN' },
  'GXI': { name: 'Air India Express', country: 'IN' },
  'AXY': { name: 'Air India Express', country: 'IN' },
  'BBD': { name: 'Blue Dart Aviation', country: 'IN' },
  'GIP': { name: 'Air Gulf', country: 'IR' },
  'IRK': { name: 'Kish Airlines', country: 'IR' },
  'IRC': { name: 'Iran Aseman', country: 'IR' },
  'BFD': { name: 'Badr', country: 'EG' },
  'MKD': { name: 'Air Excel', country: 'TZ' },
  'ATC': { name: 'Air Tanzania', country: 'TZ' },
  'COT': { name: 'Coastal Airways', country: 'BS' },
  'TLK': { name: 'Talko', country: 'ZA' },
  'KRE': { name: 'Air Kiribati', country: 'KI' },
  'FIH': { name: 'Air Fiji', country: 'FJ' },
  'M成熟': { name: 'Air Mikado', country: 'FJ' },
  'MDV': { name: 'Maldivian Air', country: 'MV' },
  'DRA': { name: 'Dragonair', country: 'HK' },
  'HKE': { name: 'Hong Kong Express', country: 'HK' },
  'CSZ': { name: 'Shenzhen Airlines', country: 'CN' },
  'DNB': { name: 'Donghai Airlines', country: 'CN' },
  'CNW': { name: 'China Northwest', country: 'CN' },
  'CXA': { name: 'Zetravel', country: 'VE' },
  'LPR': { name: 'LATAM Peru', country: 'PE' },
  'LPQ': { name: 'LATAM Bolivia', country: 'BO' },
  'LPI': { name: 'LATAM Brasil', country: 'BR' },
  'LCO': { name: 'LATAM Colombia', country: 'CO' },
  'LRC': { name: 'LATAM Costa Rica', country: 'CR' },
  'LAE': { name: 'LATAM Ecuador', country: 'EC' },
  'LAP': { name: 'LATAM Paraguay', country: 'PY' },
  'LTM': { name: 'LATAM Uruguay', country: 'UY' },
  'NVK': { name: 'Norwegian Air', country: 'NO' },
  'NAX': { name: 'Norwegian Air', country: 'NO' },
  'IBK': { name: 'Norwegian Air', country: 'NO' },
  'IBL': { name: 'Norwegian Air International', country: 'IE' },
  'GRJ': { name: 'Gol Linhas', country: 'BR' },
  'ONE': { name: 'One Airlines', country: 'CL' },
  'LPB': { name: 'LATAM Brasil', country: 'BR' },
  'PSV': { name: 'Passaredo', country: 'BR' },
  'SLZ': { name: 'Satena', country: 'CO' },
  'VVC': { name: 'Viva Air Colombia', country: 'CO' },
  'VVD': { name: 'Viva Air', country: 'CO' },
  'APE': { name: 'Air Peru', country: 'PE' },
  'TPU': { name: 'Air Transat', country: 'CA' },
  'WJQ': { name: 'WestJet Encore', country: 'CA' },
  'NTV': { name: 'Air North', country: 'CA' },
  'WNR': { name: 'Alberta Northern', country: 'CA' },
  'SCW': { name: 'Sundoor', country: 'CN' },
  'CXH': { name: 'China Xiamen Airlines', country: 'CN' },
  'ZLF': { name: 'Zhangmen', country: 'CN' },
  'CSY': { name: 'China Southern Cargo', country: 'CN' },
  'JAD': { name: 'JAL Express', country: 'JP' },
  'JAC': { name: 'JAL Air', country: 'JP' },
  'NTH': { name: 'North Wright', country: 'JP' },
  'SFJ': { name: 'Solaseed Air', country: 'JP' },
  'EIS': { name: 'AirShark', country: 'JP' },
  'SNJ': { name: 'Skymark Airlines', country: 'JP' },
  'ORC': { name: 'Orchid Airlines', country: 'JP' },
  'APJ': { name: 'Peach Aviation', country: 'JP' },
  'ADH': { name: 'Air Do', country: 'JP' },
  'SDF': { name: 'Skymark Airlines', country: 'JP' },
  'TTW': { name: 'Thai AirAsia', country: 'TH' },
  'AIQ': { name: 'Thai AirAsia', country: 'TH' },
  'TAS': { name: 'Thai AirAsia', country: 'TH' },
  'BAK': { name: 'Baku Airlines', country: 'AZ' },
  'BZP': { name: 'Belavia', country: 'BY' },
  'MAE': { name: 'Air Macedonia', country: 'MK' },
  'GRL': { name: 'Greenland Air', country: 'GL' },
  'AUG': { name: 'Air Uganda', country: 'UG' },
  'KLM': { name: 'Kenya Airways', country: 'KE' },
  'HIF': { name: 'Air Tahiti', country: 'PF' },
  'TUI': { name: 'TUI Airlines', country: 'NL' },
  'CND': { name: 'Corendon Airlines', country: 'TR' },
  'CBH': { name: 'Corendon Dutch Airlines', country: 'NL' },
  'ISW': { name: 'Israir', country: 'IL' },
  'ARN': { name: "Sun d'Or", country: 'IL' },
  'GAI': { name: 'Air Sri', country: 'LK' },
  'SKM': { name: 'Airlines', country: 'LK' },
  'DRK': { name: 'Arkefly', country: 'NL' },
  'LMU': { name: 'Air Arabia', country: 'AE' },
  'ANZ': { name: 'Air New Zealand', country: 'NZ' },
  'NZM': { name: 'Air New Zealand', country: 'NZ' },
  'PHG': { name: 'Philippine Airlines', country: 'PH' },
  'AAV': { name: 'Philippine Airlines', country: 'PH' },
  'RPX': { name: 'Royal Air Charter', country: 'PH' },
  'EKG': { name: 'Aviacsa', country: 'MX' },
  'PAM': { name: 'AirMap', country: 'JP' },
  'NJS': { name: 'Nam Air', country: 'ID' },
  'CGN': { name: 'Cirrus', country: 'US' },
  'GAJ': { name: 'General Aviation', country: 'US' },
  'UJC': { name: 'Ultimate Jetcharter', country: 'US' },
  'VNZ': { name: 'VNZ', country: 'US' },
  'RIF': { name: 'Raffles Aviation', country: 'SG' },
  'EJA': { name: 'Exec Jet', country: 'US' },
  'MAB': { name: 'Airambo', country: 'BR' },
  'BQA': { name: 'British Atlantic', country: 'GB' },
  'VPE': { name: 'Avianca Ecuador', country: 'EC' },
  'GRO': { name: 'Royal Dragon', country: 'MR' },
  'AIC': { name: 'Air India', country: 'IN' },
  'X大腿': { name: 'Fuji Dream Airlines', country: 'JP' },
};

function lookupAirline(callsign) {
  if (!callsign) return null;
  const cleaned = callsign.replace(/\s+/g, '').toUpperCase().slice(0, 3);
  return AIRLINE_PREFIXES[cleaned] || null;
}

function getCardinalDirection(heading) {
  if (heading === null || heading === undefined) return '';
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(heading / 45) % 8;
  return directions[index];
}

function formatLatLon(lat, lon) {
  if (lat === null || lon === null) return 'N/A';
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}° ${latDir}, ${Math.abs(lon).toFixed(4)}° ${lonDir}`;
}

function formatAltitude(altitudeM) {
  if (altitudeM === null || altitudeM === undefined) return 'N/A';
  const altitudeFt = altitudeM * 3.28084;
  return `${Math.round(altitudeFt).toLocaleString()} ft`;
}

function formatSpeed(speedMs) {
  if (speedMs === null || speedMs === undefined) return 'N/A';
  const mph = speedMs * 2.23694;
  return `${Math.round(mph).toLocaleString()} mph`;
}

const STATIC_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flight Tracker</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --bg-primary: #0a0e17;
      --bg-secondary: #111827;
      --bg-card: #1a2332;
      --bg-input: #0d1420;
      --border: #1e2d42;
      --accent: #3b82f6;
      --accent-dim: rgba(59, 130, 246, 0.15);
      --accent-glow: rgba(59, 130, 246, 0.4);
      --text-primary: #f1f5f9;
      --text-secondary: #94a3b8;
      --text-muted: #64748b;
      --success: #22c55e;
      --error: #ef4444;
      --cyan: #06b6d4;
      --purple: #a855f7;
    }
    body {
      font-family: 'Inter', -apple-system, sans-serif;
      background: var(--bg-primary);
      color: var(--text-primary);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40px 20px;
      background-image:
        radial-gradient(ellipse at 20% 0%, rgba(59, 130, 246, 0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 100%, rgba(6, 182, 212, 0.06) 0%, transparent 50%);
    }
    .header { text-align: center; margin-bottom: 40px; }
    .header h1 {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
      background: linear-gradient(135deg, var(--text-primary) 0%, var(--accent) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header p { color: var(--text-secondary); font-size: 0.95rem; }
    .search-container { width: 100%; max-width: 600px; margin-bottom: 40px; }
    .search-form { display: flex; gap: 12px; }
    .input-wrapper { flex: 1; position: relative; }
    .flight-input {
      width: 100%;
      padding: 14px 18px;
      background: var(--bg-input);
      border: 1px solid var(--border);
      border-radius: 12px;
      color: var(--text-primary);
      font-family: 'JetBrains Mono', monospace;
      font-size: 1.1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      transition: all 0.2s ease;
    }
    .flight-input::placeholder {
      color: var(--text-muted);
      text-transform: none;
      letter-spacing: 0;
    }
    .flight-input:focus {
      outline: none;
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-dim), 0 0 20px var(--accent-glow);
    }
    .track-btn {
      padding: 14px 28px;
      background: linear-gradient(135deg, var(--accent), #2563eb);
      border: none;
      border-radius: 12px;
      color: white;
      font-family: 'Inter', sans-serif;
      font-size: 0.95rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      white-space: nowrap;
    }
    .track-btn:hover { transform: translateY(-1px); box-shadow: 0 4px 20px var(--accent-glow); }
    .track-btn:active { transform: translateY(0); }
    .info-bar { display: flex; gap: 16px; margin-top: 12px; justify-content: center; }
    .info-tag { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-size: 0.8rem; }
    .info-tag svg { width: 14px; height: 14px; opacity: 0.7; }
    .results { width: 100%; max-width: 600px; display: flex; flex-direction: column; gap: 20px; }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border);
      border-radius: 16px;
      padding: 24px;
      animation: slideUp 0.3s ease;
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
      padding-bottom: 16px;
      border-bottom: 1px solid var(--border);
    }
    .flight-number { font-family: 'JetBrains Mono', monospace; font-size: 1.5rem; font-weight: 600; margin-bottom: 4px; }
    .airline-name { color: var(--text-secondary); font-size: 0.9rem; }
    .live-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      background: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: var(--success);
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .live-dot {
      width: 6px;
      height: 6px;
      background: var(--success);
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; margin-bottom: 20px; }
    .stat-item { background: rgba(255, 255, 255, 0.02); border-radius: 10px; padding: 14px; }
    .stat-label { color: var(--text-muted); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 6px; }
    .stat-value { font-family: 'JetBrains Mono', monospace; font-size: 1rem; font-weight: 500; }
    .stat-value.accent { color: var(--accent); }
    .stat-value.cyan { color: var(--cyan); }
    .stat-value.purple { color: var(--purple); }
    .actions { display: flex; gap: 12px; margin-top: 20px; padding-top: 20px; border-top: 1px solid var(--border); }
    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 12px 16px;
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 0.85rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .action-btn:hover { border-color: var(--accent); background: var(--accent-dim); transform: translateY(-1px); }
    .action-btn svg { width: 16px; height: 16px; }
    .action-btn.primary { background: var(--accent-dim); border-color: rgba(59, 130, 246, 0.3); }
    .action-btn.primary:hover { background: rgba(59, 130, 246, 0.25); }
    .empty-state { text-align: center; padding: 60px 20px; color: var(--text-secondary); }
    .empty-state svg { width: 64px; height: 64px; margin-bottom: 20px; opacity: 0.4; }
    .empty-state h3 { color: var(--text-primary); margin-bottom: 8px; }
    .error-state {
      text-align: center;
      padding: 40px 20px;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 16px;
    }
    .error-state svg { width: 48px; height: 48px; color: var(--error); margin-bottom: 16px; }
    .error-state h3 { color: var(--error); margin-bottom: 8px; }
    .loading { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 60px 20px; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 3px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 16px;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .country-badge {
      display: inline-flex;
      align-items: center;
      background: var(--bg-secondary);
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.7rem;
      color: var(--text-muted);
      margin-left: 8px;
    }
    footer { margin-top: 40px; text-align: center; color: var(--text-muted); font-size: 0.8rem; }
    footer a { color: var(--accent); text-decoration: none; }
    footer a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="header">
    <h1>✈ Flight Tracker</h1>
    <p>Real-time flight positions via OpenSky Network</p>
  </div>

  <div class="search-container">
    <form class="search-form" id="searchForm">
      <div class="input-wrapper">
        <input type="text" id="flightInput" class="flight-input" placeholder="e.g. UAL123, BAW178, DAL456" autofocus>
      </div>
      <button type="submit" class="track-btn">Track Flight</button>
    </form>
    <div class="info-bar">
      <div class="info-tag">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <path d="M12 6v6l4 2"></path>
        </svg>
        Live data from OpenSky Network
      </div>
    </div>
  </div>

  <div class="results" id="results">
    <div class="empty-state">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
      </svg>
      <h3>Enter a Flight Number</h3>
      <p>Type a callsign like UAL123, BAW178, or DAL456</p>
    </div>
  </div>

  <footer>
    Data: <a href="https://opensky-network.org" target="_blank">OpenSky Network</a> ·
    <a href="https://www.flightradar24.com" target="_blank">FlightRadar24</a> ·
    <a href="https://www.skyscanner.net" target="_blank">Skyscanner</a>
  </footer>

  <script>
    const resultsEl = document.getElementById('results');
    const form = document.getElementById('searchForm');
    const input = document.getElementById('flightInput');

    function showLoading() {
      resultsEl.innerHTML = \`
        <div class="loading">
          <div class="spinner"></div>
          <p style="color: var(--text-secondary);">Looking up flight...</p>
        </div>
      \`;
    }

    function showError(message) {
      resultsEl.innerHTML = \`
        <div class="error-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M15 9l-6 6M9 9l6 6"></path>
          </svg>
          <h3>Flight Not Found</h3>
          <p>\${message}</p>
        </div>
      \`;
    }

    function showFlight(data) {
      const airline = data.airline;
      const airlineDisplay = airline
        ? \`\${airline.name}<span class="country-badge">\${airline.country}</span>\`
        : 'Unknown Airline';
      
      const heading = data.heading || 0;
      const direction = data.direction || '';
      const position = data.position || 'N/A';
      const altitude = data.altitude || 'N/A';
      const speed = data.speed || 'N/A';
      const icao24 = data.icao24 ? data.icao24.toUpperCase() : 'N/A';
      const fr24Url = data.icao24
        ? \`https://www.flightradar24.com/\${data.icao24.toLowerCase()}\`
        : '#';
      const skyscanUrl = \`https://www.skyscanner.net/transport/flights/\${encodeURIComponent(data.callsign || '')}/\`;

      resultsEl.innerHTML = \`
        <div class="card">
          <div class="card-header">
            <div>
              <div class="flight-number">\${data.callsign || 'Unknown'}</div>
              <div class="airline-name">\${airlineDisplay}</div>
            </div>
            <div class="live-badge">
              <span class="live-dot"></span>
              Live
            </div>
          </div>
          <div class="stats-grid">
            <div class="stat-item">
              <div class="stat-label">Position</div>
              <div class="stat-value">\${position}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Altitude</div>
              <div class="stat-value accent">\${altitude}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Speed</div>
              <div class="stat-value cyan">\${speed}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Heading</div>
              <div class="stat-value purple">\${heading}° \${direction}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Aircraft (ICAO24)</div>
              <div class="stat-value">\${icao24}</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">Data Source</div>
              <div class="stat-value">OpenSky Network</div>
            </div>
          </div>
          <div class="actions">
            <a href="\${fr24Url}" target="_blank" class="action-btn primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Track on FlightRadar24
            </a>
            <a href="\${skyscanUrl}" target="_blank" class="action-btn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <path d="m21 21-4.35-4.35"></path>
              </svg>
              Search on Skyscanner
            </a>
          </div>
        </div>
      \`;
    }

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const flight = input.value.trim();
      if (!flight) return;
      
      showLoading();
      
      try {
        const res = await fetch(\`/api/flight?flight=\${encodeURIComponent(flight)}\`);
        const data = await res.json();
        
        if (!res.ok) {
          showError(data.error || 'Flight not found');
          return;
        }
        
        showFlight(data);
      } catch (err) {
        showError('Network error. Please try again.');
      }
    });

    // Check for flight in URL params
    const params = new URLSearchParams(window.location.search);
    const flightParam = params.get('flight');
    if (flightParam) {
      input.value = flightParam;
      input.dispatchEvent(new Event('submit'));
    }
  </script>
</body>
</html>`;

async function fetchFlightData(callsign) {
  const cleanCallsign = callsign.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
  const prefix = cleanCallsign.slice(0, 3);

  // Check cache first
  const cached = getCached(prefix);
  if (cached) {
    // Find matching in cached data
    const match = cached.find(state => {
      const stateCallsign = (state[1] || '').replace(/\s+$/, '').toUpperCase();
      return stateCallsign.startsWith(prefix) || stateCallsign === cleanCallsign;
    });
    if (match) {
      return buildFlightResponse(match, cleanCallsign);
    }
  }

  // Fetch from OpenSky with a custom User-Agent (they recommend this)
  const statesUrl = 'https://opensky-network.org/api/states/all?lamin=25&lomin=-140&lamax=72&lomax=60';
  
  const response = await fetch(statesUrl, {
    headers: {
      'User-Agent': 'FlightTracker/1.0 (contact@example.com)'
    }
  });
  
  if (!response.ok) {
    if (response.status === 429) {
      throw new Error('OpenSky rate limit reached. Please wait a moment and try again.');
    }
    throw new Error('OpenSky Network is currently unavailable');
  }
  
  const data = await response.json();
  const states = data.states || [];
  
  // Cache the response
  setCached(prefix, states);
  
  // Find matching flight
  const matching = states.find(state => {
    const stateCallsign = (state[1] || '').replace(/\s+$/, '').toUpperCase();
    return stateCallsign.startsWith(prefix) || stateCallsign === cleanCallsign;
  });
  
  if (!matching) {
    throw new Error(`No active flight found for "${callsign}". The flight may not be airborne or within OpenSky's coverage area (Europe, North Atlantic).`);
  }
  
  return buildFlightResponse(matching, cleanCallsign);
}

function buildFlightResponse(state, cleanCallsign) {
  const icao24 = state[0];
  const stateCallsign = (state[1] || '').replace(/\s+$/, '').toUpperCase();
  const airline = lookupAirline(stateCallsign);
  
  const latitude = state[6];
  const longitude = state[5];
  const altitude = state[7];
  const velocity = state[9];
  const heading = state[10];
  
  return {
    icao24,
    callsign: stateCallsign || cleanCallsign,
    airline,
    position: formatLatLon(latitude, longitude),
    altitude: formatAltitude(altitude),
    speed: formatSpeed(velocity),
    heading: heading !== null && heading !== undefined ? Math.round(heading) : 'N/A',
    direction: getCardinalDirection(heading),
  };
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;

  // Serve static HTML
  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(STATIC_HTML);
    return;
  }

  // API endpoint
  if (pathname === '/api/flight') {
    const flight = parsedUrl.query.flight;
    if (!flight) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Flight number required' }));
      return;
    }

    try {
      const data = await fetchFlightData(flight);
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify(data));
    } catch (error) {
      res.writeHead(404, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(JSON.stringify({ error: error.message }));
    }
    return;
  }

  // 404
  res.writeHead(404);
  res.end('Not Found');
});

server.listen(PORT, () => {
  console.log(`Flight Tracker running at http://localhost:${PORT}`);
});
