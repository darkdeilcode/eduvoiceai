"use client";

import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";

interface CEFRDocumentationProps {
  level: string;
}

export function CEFRDocumentation({ level }: CEFRDocumentationProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>About CEFR {level}</CardTitle>
        <CardDescription>
          Common European Framework of Reference for Languages
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {getCEFRLevelContent(level).map((section, index) => (
            <AccordionItem key={index} value={`section-${index}`}>
              <AccordionTrigger>{section.title}</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4 mt-2">
                  <p className="text-sm text-muted-foreground">{section.description}</p>
                  
                  {section.skills && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Key Skills:</h4>
                      <ul className="space-y-1 text-sm">
                        {section.skills.map((skill, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary">•</span>
                            <span>{skill}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {section.examples && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">Examples:</h4>
                      <ul className="space-y-1 text-sm">
                        {section.examples.map((example, idx) => (
                          <li key={idx} className="flex gap-2">
                            <span className="text-primary">→</span>
                            <span>{example}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  );
}

function getCEFRLevelContent(level: string) {
  switch (level) {
    case "A1":
      return [
        {
          title: "Beginner Level (A1)",
          description: "Can understand and use familiar everyday expressions and very basic phrases aimed at the satisfaction of needs of a concrete type.",
          skills: [
            "Can introduce themselves and others",
            "Can ask and answer questions about personal details",
            "Can interact in a simple way provided the other person talks slowly and clearly"
          ],
          examples: [
            "Can order food and drinks",
            "Can understand simple directions",
            "Can fill out a simple form with personal information"
          ]
        }
      ];
    case "A2":
      return [
        {
          title: "Elementary Level (A2)",
          description: "Can understand sentences and frequently used expressions related to areas of most immediate relevance (e.g. very basic personal and family information, shopping, local geography, employment).",
          skills: [
            "Can communicate in simple and routine tasks",
            "Can describe in simple terms aspects of their background",
            "Can describe immediate environment and matters of immediate need"
          ],
          examples: [
            "Can make simple transactions in shops, post offices or banks",
            "Can arrange a meeting with someone",
            "Can describe past activities and personal experiences"
          ]
        }
      ];
    case "B1":
      return [
        {
          title: "Intermediate Level (B1)",
          description: "Can understand the main points of clear standard input on familiar matters regularly encountered in work, school, leisure, etc.",
          skills: [
            "Can deal with most situations likely to arise while traveling",
            "Can produce simple connected text on topics which are familiar",
            "Can describe experiences, events, dreams, hopes and ambitions"
          ],
          examples: [
            "Can participate in discussions on familiar topics",
            "Can write personal letters describing experiences and impressions",
            "Can understand the main points of radio or TV programs on current affairs"
          ]
        }
      ];
    case "B2":
      return [
        {
          title: "Upper Intermediate Level (B2)",
          description: "Can understand the main ideas of complex text on both concrete and abstract topics, including technical discussions in their field of specialization.",
          skills: [
            "Can interact with a degree of fluency and spontaneity with native speakers",
            "Can produce clear, detailed text on a wide range of subjects",
            "Can explain a viewpoint on a topical issue giving advantages and disadvantages"
          ],
          examples: [
            "Can follow extended speech and complex lines of argument",
            "Can actively participate in discussions in familiar contexts",
            "Can read articles and reports about contemporary problems"
          ]
        }
      ];
    case "C1":
      return [
        {
          title: "Advanced Level (C1)",
          description: "Can understand a wide range of demanding, longer texts, and recognize implicit meaning. Can express themselves fluently and spontaneously without much obvious searching for expressions.",
          skills: [
            "Can use language flexibly and effectively for social, academic and professional purposes",
            "Can produce clear, well-structured, detailed text on complex subjects",
            "Can formulate ideas and opinions with precision"
          ],
          examples: [
            "Can understand complex technical instructions",
            "Can follow films employing a considerable degree of slang and idiomatic usage",
            "Can express themselves fluently and convey finer shades of meaning precisely"
          ]
        }
      ];
    case "C2":
      return [
        {
          title: "Proficiency Level (C2)",
          description: "Can understand with ease virtually everything heard or read. Can summarize information from different spoken and written sources, reconstructing arguments and accounts in a coherent presentation.",
          skills: [
            "Can express themselves spontaneously, very fluently and precisely",
            "Can differentiate finer shades of meaning even in the most complex situations",
            "Can use idiomatic expressions and colloquialisms appropriately"
          ],
          examples: [
            "Can understand any kind of spoken language, whether live or broadcast",
            "Can read virtually all forms of the written language",
            "Can write complex essays, reports, articles or stories with a confident, personal style"
          ]
        }
      ];
    default:
      return [
        {
          title: "CEFR Information",
          description: "The Common European Framework of Reference for Languages (CEFR) is an international standard for describing language ability. It is used around the world to describe learners' language skills."
        }
      ];
  }
}
