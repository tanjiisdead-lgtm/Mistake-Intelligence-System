"use client";

import React, { useState, useEffect, useCallback } from "react";
import { AlertCircle, Clock, Send, TrendingUp, Brain, Zap } from "lucide-react";

interface Question {
  id: number;
  question_code: string;
  text: string;
  options: string[];
  subject: string;
  chapter: string;
  virtual_tier: number;
}

export default function TestEngine() {
  const [question, setQuestion] = useState<Question | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [startTime, setStartTime] = useState<number>(0);
  const [firstInteractionTime, setFirstInteractionTime] = useState<number | null>(null);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [answerChanges, setAnswerChanges] = useState(0);
  const [confidence, setConfidence] = useState(3);
  const [timeLeft, setTimeLeft] = useState(180); // 3 minutes default
  const [isPanicMode, setIsPanicMode] = useState(false);
  const [momentum, setMomentum] = useState(1.0);
  const [message, setMessage] = useState("");

  const fetchQuestion = async () => {
    try {
      const res = await fetch("/api/next-question/");
      const data = await res.json();
      setQuestion(data);
      setStartTime(Date.now());
      setFirstInteractionTime(null);
      setSelectedOption(null);
      setAnswerChanges(0);
      setConfidence(3);
      setTimeLeft(isPanicMode ? 120 : 180);
      setMessage("");
    } catch (err) {
      console.error("Failed to fetch question", err);
    }
  };

  useEffect(() => {
    fetchQuestion();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitches((prev) => prev + 1);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          // In panic mode, timer might accelerate
          const decrement = isPanicMode && prev < 30 ? 2 : 1;
          return Math.max(0, prev - decrement);
        });
      }, 1000);
      return () => clearInterval(timer);
    } else if (question) {
        // Handle timeout
        submitAttempt(null);
    }
  }, [timeLeft, question, isPanicMode]);

  const handleOptionSelect = (idx: number) => {
    if (firstInteractionTime === null) {
      setFirstInteractionTime(Date.now());
    }
    if (selectedOption !== null && selectedOption !== idx) {
      setAnswerChanges((prev) => prev + 1);
    }
    setSelectedOption(idx);
  };

  const submitAttempt = async (forcedOption: number | null = selectedOption) => {
    if (!question) return;

    const endTime = Date.now();
    const timeSpent = (endTime - startTime) / 1000;
    const hesitation = firstInteractionTime ? (firstInteractionTime - startTime) / 1000 : timeSpent;

    const attempt = {
      question_id: question.id,
      selected_option: forcedOption,
      time_spent: timeSpent,
      confidence_score: confidence,
      hesitation_score: hesitation,
      tab_switches: tabSwitches,
      answer_changes: answerChanges,
    };

    try {
      const res = await fetch("/api/submit-attempt/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(attempt),
      });
      const result = await res.json();

      setMomentum((prev) => prev + result.momentum_delta);
      setMessage(result.is_correct ? "Correct! Momentum increased." : "Incorrect. Tier updated.");

      // Auto-trigger panic mode if momentum drops too low
      if (momentum + result.momentum_delta < 0.5 && !isPanicMode) {
          setIsPanicMode(true);
          setMessage("Warning: Pressure increasing! Panic Mode Activated.");
      }

      setTimeout(fetchQuestion, 2000);
    } catch (err) {
      console.error("Submission failed", err);
    }
  };

  if (!question) return <div className="flex items-center justify-center h-screen">Loading Question...</div>;

  return (
    <div className={`min-h-screen p-8 transition-colors duration-500 ${isPanicMode ? 'bg-red-50' : 'bg-slate-50'}`}>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Stats */}
        <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center text-blue-600 font-bold">
              <TrendingUp className="w-5 h-5 mr-1" />
              Momentum: {momentum.toFixed(2)}
            </div>
            <div className={`flex items-center font-bold ${timeLeft < 30 ? 'text-red-600 animate-pulse' : 'text-gray-700'}`}>
              <Clock className="w-5 h-5 mr-1" />
              {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {isPanicMode && <Zap className="text-red-600 w-6 h-6 fill-current animate-bounce" />}
            <span className="px-3 py-1 bg-slate-200 rounded-full text-xs font-semibold">Tier {question.virtual_tier}</span>
          </div>
        </div>

        {/* Question Area */}
        <div className="bg-white p-8 rounded-2xl shadow-md border border-slate-100">
          <h2 className="text-sm font-bold text-blue-500 uppercase tracking-widest mb-2">{question.subject} • {question.chapter}</h2>
          <p className="text-xl text-slate-800 leading-relaxed mb-8">{question.text}</p>

          <div className="grid grid-cols-1 gap-4">
            {question.options.map((option, idx) => (
              <button
                key={idx}
                onClick={() => handleOptionSelect(idx)}
                className={`p-4 text-left rounded-xl border-2 transition-all ${
                  selectedOption === idx
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-slate-100 hover:border-slate-300 bg-slate-50"
                }`}
              >
                <span className="inline-block w-8 font-bold">{String.fromCharCode(65 + idx)}.</span>
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex items-center space-x-4 bg-white p-3 rounded-xl shadow-sm border border-slate-100">
            <Brain className="text-purple-500 w-5 h-5" />
            <span className="text-sm font-medium">Confidence:</span>
            <input
              type="range" min="1" max="5"
              value={confidence}
              onChange={(e) => setConfidence(parseInt(e.target.value))}
              className="w-32 accent-purple-500"
            />
            <span className="w-4 font-bold text-purple-600">{confidence}</span>
          </div>

          <button
            onClick={() => submitAttempt()}
            className="flex items-center space-x-2 px-8 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-transform active:scale-95 shadow-lg shadow-blue-200"
          >
            <Send className="w-4 h-4" />
            <span>Submit Answer</span>
          </button>
        </div>

        {message && (
          <div className={`p-4 rounded-xl text-center font-bold animate-in fade-in slide-in-from-bottom-4 ${
            message.includes("Correct") ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
          }`}>
            {message}
          </div>
        )}

        {isPanicMode && (
          <div className="bg-red-600 text-white p-4 rounded-xl flex items-center justify-center space-x-2 animate-pulse font-black text-lg">
            <AlertCircle />
            <span>PANIC MODE ACTIVE: STAY FOCUSED</span>
          </div>
        )}
      </div>
    </div>
  );
}
