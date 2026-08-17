import { runAuthTests } from "./suites/auth.test";
import { runReportsTests } from "./suites/reports.test";
import { runNgoGpsTests } from "./suites/ngo-gps.test";
import { runAdminAnalyticsTests } from "./suites/admin-analytics.test";
import { runFrontendRoutesTests } from "./suites/frontend-routes.test";
import { colors, TestResult, API_BASE, FRONTEND_BASE } from "./utils";

async function main() {
  console.log("");
  console.log(`${colors.bright}${colors.cyan}=================================================================${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}  🧪 JanSamvedan Comprehensive End-to-End Test Suite${colors.reset}`);
  console.log(`${colors.bright}${colors.cyan}=================================================================${colors.reset}`);
  console.log(`  🌐 Frontend URL: ${FRONTEND_BASE}`);
  console.log(`  ⚙️  Backend API:  ${API_BASE}`);
  console.log(`${colors.cyan}-----------------------------------------------------------------${colors.reset}`);
  console.log("");

  const suites: { name: string; runner: () => Promise<TestResult[]> }[] = [
    { name: "🔐 Authentication, Roles & Security", runner: runAuthTests },
    { name: "📋 Civic Reports, Duplicates & Upvoting", runner: runReportsTests },
    { name: "📍 NGO Service Area, Haversine GPS & Pledges", runner: runNgoGpsTests },
    { name: "🛡️  Admin Triage, SLA Analytics & Exports", runner: runAdminAnalyticsTests },
    { name: "🖥️  Frontend UI Routes & Compilation", runner: runFrontendRoutesTests },
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const startTime = Date.now();

  for (const suite of suites) {
    console.log(`${colors.bright}${colors.yellow}► Running Suite: ${suite.name}${colors.reset}`);
    try {
      const results = await suite.runner();
      for (const res of results) {
        if (res.passed) {
          totalPassed++;
          console.log(
            `  ${colors.green}✔ PASS${colors.reset}  ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`
          );
        } else {
          totalFailed++;
          console.log(
            `  ${colors.red}✖ FAIL${colors.reset}  ${res.name} ${colors.gray}(${res.durationMs}ms)${colors.reset}`
          );
          console.log(`         ${colors.red}Error: ${res.error}${colors.reset}`);
        }
      }
    } catch (err: any) {
      console.log(`  ${colors.red}✖ SUITE CRASHED:${colors.reset} ${err.message}`);
      totalFailed++;
    }
    console.log("");
  }

  const totalTime = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`${colors.cyan}=================================================================${colors.reset}`);
  console.log(`${colors.bright}  📊 Test Execution Summary:${colors.reset}`);
  console.log(`     Total Tests:  ${totalPassed + totalFailed}`);
  console.log(`     ${colors.green}Passed:       ${totalPassed}${colors.reset}`);
  if (totalFailed > 0) {
    console.log(`     ${colors.red}Failed:       ${totalFailed}${colors.reset}`);
  } else {
    console.log(`     ${colors.gray}Failed:       0${colors.reset}`);
  }
  console.log(`     Duration:     ${totalTime}s`);
  console.log(`${colors.cyan}=================================================================${colors.reset}`);

  if (totalFailed === 0) {
    console.log(`${colors.bright}${colors.green}  🎉 ALL SYSTEM TESTS PASSED SUCCESSFULLY!${colors.reset}`);
    console.log("");
    process.exit(0);
  } else {
    console.log(`${colors.bright}${colors.red}  ⚠️  SOME TESTS FAILED - REVIEW LOGS ABOVE${colors.reset}`);
    console.log("");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Fatal Test Runner Error:", err);
  process.exit(1);
});
