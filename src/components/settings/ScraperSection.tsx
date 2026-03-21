"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Globe, Search, Loader2, Package, Tag, Info, RefreshCw } from 'lucide-react';
import { ScrapedData } from '@/lib/mock-api';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';

interface ScraperSectionProps {
  url: string;
  scrapedData?: ScrapedData;
  onScrape: (url: string) => Promise<any>;
  loading: boolean;
}

export const ScraperSection = ({ url, scrapedData, onScrape, loading }: ScraperSectionProps) => {
  const [inputUrl, setInputUrl] = useState(url);

  const handleScrape = () => {
    if (!inputUrl) return;
    onScrape(inputUrl);
  };

  return (
    <Card className="rounded-3xl border-border/50 shadow-sm overflow-hidden">
      <CardHeader className="bg-primary/5 border-b border-border/50 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Globe className="w-5 h-5 text-primary" />
          </div>
          <CardTitle className="text-xl font-bold">Ecommerce Scraper</CardTitle>
        </div>
        <CardDescription className="text-muted-foreground font-medium">
          Provide your store URL to train the bot on your products, prices, and descriptions.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-8 space-y-8">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="store-url" className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Store URL
            </Label>
            <div className="flex gap-3">
              <Input
                id="store-url"
                placeholder="https://your-store.com"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                className="h-12 rounded-xl border-border/50 focus:ring-primary/20"
              />
              <Button 
                onClick={handleScrape} 
                disabled={loading || !inputUrl}
                className="h-12 px-6 rounded-xl font-bold gap-2 min-w-[140px]"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                {loading ? 'Scraping...' : 'Start Scrape'}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {scrapedData ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Ingested Products</h3>
                <Badge variant="secondary" className="rounded-full px-3 py-1 font-bold">
                  {scrapedData.products.length} Items Found
                </Badge>
              </div>

              <div className="grid gap-4">
                {scrapedData.products.map((product, idx) => (
                  <div 
                    key={idx} 
                    className="flex items-start gap-4 p-4 rounded-2xl bg-accent/30 border border-border/50 hover:border-primary/20 transition-colors"
                  >
                    <div className="p-3 bg-white rounded-xl shadow-sm border border-border/50">
                      <Package className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-bold truncate">{product.name}</h4>
                        <span className="text-primary font-bold text-sm">{product.price}</span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-blue-600">
                <Info className="w-4 h-4 shrink-0" />
                <p className="text-xs font-medium">
                  Last updated: {new Date(scrapedData.lastScraped).toLocaleString()}
                </p>
                <Button variant="ghost" size="sm" className="ml-auto h-8 rounded-lg text-blue-600 hover:bg-blue-500/10 gap-1" onClick={handleScrape}>
                  <RefreshCw className="w-3 h-3" /> Sync
                </Button>
              </div>
            </motion.div>
          ) : !loading && (
            <div className="flex flex-col items-center justify-center py-12 text-center space-y-4 bg-accent/20 rounded-3xl border-2 border-dashed border-border/50">
              <div className="p-4 bg-background rounded-full shadow-sm">
                <Globe className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <p className="font-bold text-lg">No data ingested yet</p>
                <p className="text-sm text-muted-foreground max-w-[280px] mx-auto">
                  Enter your store URL above to start training your AI sales assistant.
                </p>
              </div>
            </div>
          )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
};