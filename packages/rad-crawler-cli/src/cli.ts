#!/usr/bin/env node
/**
 * RAD Crawler CLI
 * Command-line interface for RAD document indexing
 */

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import { RadCrawlerCore } from '@robinson_ai_systems/rad-crawler-core';

const program = new Command();

program
  .name('rad-crawler')
  .description('RAD Crawler - Document indexing for Repository Agent Database')
  .version('0.1.0');

// Run command
program
  .command('run')
  .description('Run a crawl for a source')
  .requiredOption('--source <sourceId>', 'Source ID to crawl')
  .option('--overrides <json>', 'JSON overrides for crawl configuration')
  .action(async (options) => {
    const spinner = ora('Starting crawl...').start();

    try {
      const crawler = new RadCrawlerCore();
      
      const runOptions: any = {
        sourceId: options.source,
      };

      if (options.overrides) {
        try {
          runOptions.overrides = JSON.parse(options.overrides);
        } catch (error) {
          spinner.fail('Invalid JSON in --overrides');
          process.exit(1);
        }
      }

      spinner.text = 'Running crawl...';
      const result = await crawler.runCrawl(runOptions);

      await crawler.close();

      if (result.status === 'completed') {
        spinner.succeed(chalk.green('Crawl completed successfully!'));
        console.log(chalk.cyan('\n📊 Results:'));
        console.log(`  Crawl ID: ${result.crawlId}`);
        console.log(`  Documents discovered: ${result.documentsDiscovered}`);
        console.log(`  Documents processed: ${result.documentsProcessed}`);
        console.log(`  Documents failed: ${result.documentsFailed}`);
        console.log(`  Chunks created: ${result.chunksCreated}`);
        console.log(`  Duration: ${getDuration(result.startedAt, result.completedAt!)}`);
      } else {
        spinner.fail(chalk.red('Crawl failed!'));
        console.log(chalk.red(`\n❌ Error: ${result.errorMessage}`));
        console.log(chalk.cyan('\n📊 Partial results:'));
        console.log(`  Crawl ID: ${result.crawlId}`);
        console.log(`  Documents discovered: ${result.documentsDiscovered}`);
        console.log(`  Documents processed: ${result.documentsProcessed}`);
        console.log(`  Documents failed: ${result.documentsFailed}`);
        process.exit(1);
      }

    } catch (error) {
      spinner.fail(chalk.red('Crawl failed!'));
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Get status of a crawl')
  .requiredOption('--crawl <crawlId>', 'Crawl ID to check')
  .action(async (options) => {
    const spinner = ora('Fetching crawl status...').start();

    try {
      const crawler = new RadCrawlerCore();
      const result = await crawler.getCrawlStatus(options.crawl);
      await crawler.close();

      spinner.succeed(chalk.green('Status retrieved!'));
      
      console.log(chalk.cyan('\n📊 Crawl Status:'));
      console.log(`  Crawl ID: ${result.crawlId}`);
      console.log(`  Status: ${getStatusBadge(result.status)}`);
      console.log(`  Started: ${result.startedAt.toISOString()}`);
      if (result.completedAt) {
        console.log(`  Completed: ${result.completedAt.toISOString()}`);
        console.log(`  Duration: ${getDuration(result.startedAt, result.completedAt)}`);
      }
      console.log(`  Documents discovered: ${result.documentsDiscovered}`);
      console.log(`  Documents processed: ${result.documentsProcessed}`);
      console.log(`  Documents failed: ${result.documentsFailed}`);
      console.log(`  Chunks created: ${result.chunksCreated}`);
      
      if (result.errorMessage) {
        console.log(chalk.red(`\n❌ Error: ${result.errorMessage}`));
      }

    } catch (error) {
      spinner.fail(chalk.red('Failed to fetch status!'));
      console.error(chalk.red('\n❌ Error:'), error);
      process.exit(1);
    }
  });

program.parse();

// Helper functions
function getStatusBadge(status: string): string {
  switch (status) {
    case 'completed':
      return chalk.green('✓ COMPLETED');
    case 'running':
      return chalk.blue('⟳ RUNNING');
    case 'pending':
      return chalk.yellow('⏳ PENDING');
    case 'failed':
      return chalk.red('✗ FAILED');
    case 'cancelled':
      return chalk.gray('⊘ CANCELLED');
    default:
      return status;
  }
}

function getDuration(start: Date, end: Date): string {
  const ms = end.getTime() - start.getTime();
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

