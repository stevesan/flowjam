
using UnityEngine;
using System.Collections.Generic;
using System.Collections;
using SteveSharp;

public class RhymeTester : MonoBehaviour
{
    string first = "mouse";
    string second = "house";

    void OnGUI()
    {
        GUILayout.BeginArea( new Rect(10, 10, Screen.width/3, Screen.height) );

        if( !RhymeScorer.main || !RhymeScorer.main.GetIsReady() )
        {
            GUILayout.Label("RhymeScorer not ready");
            GUILayout.EndArea();
            return;
        }

        first = GUILayout.TextField(first);
        second = GUILayout.TextField(second);

        GUILayout.Label("Score = "
                + RhymeScorer.main.ScoreStrings( first, second ) );

        GUILayout.Label("Too similar? "+RhymeScorer.main.IsTooSimilar(first, second));

        // show pronunciation

        PhraseAnalysisGUI(first);
        PhraseAnalysisGUI(second);

        GUILayout.EndArea();
    }

    public static void PhraseAnalysisGUI( string phrase )
    {
        if( !RhymeScorer.main.IsValidAnswer(phrase) )
        {
            GUILayout.Label("Not valid phrase: "+phrase);
            return;
        }
        var split = phrase.Split(' ');

        string info = "\""+phrase+"\" analysis:\n";

        int count = 0;

        foreach( var pronun in RhymeScorer.main.GetPhrasePronuns(split) )
        {
            info += (count+1)+". ";

            foreach( var syl in pronun )
            {
                info += syl.nucleus + " "+syl.coda + ", ";
            }
            info += "\n";
        }

        GUILayout.Label(info);
    }
}
