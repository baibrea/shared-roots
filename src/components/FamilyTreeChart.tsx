"use client";

import { useEffect, useRef } from "react";
import * as f3 from "family-chart";
import "family-chart/styles/family-chart.css";

import { Person } from "@/types/person";
import { convertPeopleToFamilyChart } from "@/lib/convertPeopleToChart";

interface FamilyChartProps {
    people: Person[];
}

export default function FamilyTreeChart({ people }: FamilyChartProps) {
    const chartRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartRef.current) return;
        if(people.length === 0) return;

        chartRef.current.innerHTML = ""; // Clear previous chart if it exists

        const familyChartData = convertPeopleToFamilyChart(people);

        const chart = f3.createChart(
            chartRef.current,
            familyChartData
        );

        chart.setCardHtml().setCardDisplay([
            ["first name", "last name"],
            ["birth date"],
            ["avatar"]
        ]);

        chart.updateTree({ initial: true });
    
    }, [people]);

    return (
        <div ref={chartRef} className="w-full h-[600px] bg-white rounded-xl shadow p-4" />
    );
}