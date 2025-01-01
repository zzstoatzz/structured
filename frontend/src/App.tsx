// frontend/src/App.tsx
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface JsonSchema {
  title: string
  description: string
  type: string
  properties: Record<string, any>
  required?: string[]
}

interface Schemas {
  [key: string]: JsonSchema
}

const AIInterface = () => {
  const [input, setInput] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSchema, setSelectedSchema] = useState<string>('');
  const [schemas, setSchemas] = useState<Schemas>({});
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchSchemas = async () => {
      try {
        const response = await fetch('http://localhost:8000/schemas');
        if (!response.ok) throw new Error('Failed to fetch schemas');
        const data = await response.json();
        setSchemas(data);
      } catch (err) {
        setError('Failed to load schemas. Is the backend running?');
        console.error('Error fetching schemas:', err);
      }
    };

    fetchSchemas();
  }, []);

  const handleSubmit = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`http://localhost:8000/generate/${selectedSchema}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: input }),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const data = await response.json();
      setResponse(JSON.stringify(data, null, 2));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate output');
      console.error('Error generating output:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen bg-earth-100 flex items-center justify-center p-4">
      <Card className="w-1/3 min-w-[400px] border-earth-200 bg-white/80 backdrop-blur-sm shadow-lg">
        <CardHeader className="border-b border-earth-200">
          <CardTitle className="text-earth-800 text-center">Structured Output Generator</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 p-6">
          {error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <div className="space-y-4">
              <Select onValueChange={setSelectedSchema} value={selectedSchema}>
                <SelectTrigger className="w-full bg-earth-50 border-earth-200">
                  <SelectValue placeholder="Select output format..." />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(schemas).map(([name, schema]) => (
                    <SelectItem key={name} value={name}>
                      <div className="flex flex-col w-full">
                        <span className="font-medium">{schema.title}</span>
                        <span className="text-xs text-earth-500/80">{schema.description}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Textarea
                placeholder={selectedSchema
                  ? `Describe the ${selectedSchema.toLowerCase()} you want to generate...`
                  : "Select an output format above..."}
                className="min-h-32 bg-earth-50 border-earth-200 focus:border-earth-300 focus:ring-earth-300"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={!selectedSchema}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && input.trim() && selectedSchema && !isLoading) {
                    e.preventDefault();
                    handleSubmit();
                  }
                }}
              />
              <Button
                className="w-full bg-earth-600 hover:bg-earth-700 text-white"
                onClick={handleSubmit}
                disabled={isLoading || !input.trim() || !selectedSchema}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : 'Generate'}
              </Button>
            </div>
          )}

          {response && (
            <Card className="bg-earth-50 border-earth-200">
              <CardContent className="pt-6">
                <pre className="whitespace-pre-wrap font-mono text-sm text-earth-800">
                  {response}
                </pre>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AIInterface;