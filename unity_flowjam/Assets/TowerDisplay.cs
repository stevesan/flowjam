using UnityEngine;
using System.Collections.Generic;
using SteveSharp;

public class TowerDisplay : MonoBehaviour
{
    public char emptyChar = '-';
    public int width = 3;
    public int height = 10;
    public Color highlightColor = Color.yellow;
    public Color attackableColor = Color.red;

    public bool attackOK = false;

    class Entry
    {
        public char c;
        public GUIText display;
        public bool marked;
        public bool toprow;
        public TowerDisplay parent;

        public void Reset(char newChar)
        {
            c = newChar;
            marked = false;
        }

        public void Copy( Entry other )
        {
            this.c = other.c;
            this.marked = other.marked;
        }

        public void Update()
        {
            display.text = ""+System.Char.ToUpper(c);
            if( toprow )
                display.color = Color.red;
            else 
            { 
                if( marked )
                {
                    if( parent.attackOK )
                        display.color = parent.attackableColor;
                    else
                        display.color = parent.highlightColor;
                }
                else
                    display.color = Color.white;
            }
        }
    }
    Entry[,] grid;

    public GUIText letterPrefab;
    public Vector2 bottomLeftPixelOfs;
    public bool debugControls;

    public void Reset(int width, int height)
    {
        if( grid != null )
        {
            for( int x = 0; x < grid.GetLength(0); x++ )
                for( int y = 0; y < grid.GetLength(1); y++ )
                    Destroy(grid[x,y].display.gameObject);
        }

        this.width = width;
        this.height = height;

        grid = new Entry[width, height];
        for( int x = 0; x < width; x++ )
        for( int y = 0; y < height; y++ )
        {
            grid[x,y] = new Entry();
            grid[x,y].display = Utility.Instantiate(
                    letterPrefab.gameObject,
                    new Vector3(0, 0, 0),
                    transform ).GetComponent<GUIText>();
            grid[x,y].display.pixelOffset = 
                bottomLeftPixelOfs +
                new Vector2( x * 25, y * 35 );
            grid[x,y].Reset(emptyChar);
            grid[x,y].parent = this;
        }

        // top row red
        for( int x = 0; x < width; x++ )
            grid[x, height-1].toprow = true;
    }

	// Update is called once per frame
	void Update()
    {
        for( int x = 0; x < width; x++ )
        for( int y = 0; y < height; y++ )
        {
            grid[x,y].Update();
        }

        if( debugControls )
        {
            if( Input.GetKeyDown(KeyCode.Space) )
                PushRow();

            if( Input.GetKeyDown("b") )
                ClearBlock( Random.Range(0, width), Random.Range(0, height) );
        }
    }

    char RandomChar()
    {
        return (char)Random.Range( (int)'a', (int)'z' );
    }

    public bool TopRowOccupied()
    {
        for( int x = 0; x < width; x++ )
        {
            if( grid[x, height-1].c != emptyChar )
                return true;
        }
        return false;
    }

    public void PushBlock( int cx, char letter )
    {
        // push up
        for( int y = height-1; y > 0; y-- )
        {
            grid[cx,y].Copy( grid[cx,y-1] );
        }
        grid[cx, 0].Reset( letter );
    }

    public void PushRow()
    {
        // lift all up
        for( int y = height-1; y > 0; y-- )
        {
            for( int x = 0; x < width; x++ )
                grid[x,y].Copy( grid[x,y-1] );
        }

        // new char
        for( int x = 0; x < width; x++ )
            grid[x, 0].Reset( RandomChar() );
    }

    public void ClearBlock( int cx, int cy )
    {
        // drop all above
        for( int y = cy; y < height-1; y++ )
        {
            grid[cx, y].Copy( grid[cx, y+1] );
            grid[cx, y+1].Reset(emptyChar);
        }
    }

    public char GetLower( int x, int y )
    {
        return System.Char.ToLower(grid[x,y].c);
    }

    public bool IsMarked( int x, int y )
    {
        return grid[x,y].marked;
    }

    public int GetColumnSize( int x )
    {
        for( int y = 0; y < height; y++ )
        {
            if( grid[x,y].c == emptyChar )
                return y;
        }
        return height;
    }

    public bool ColumnContainsUnmarked( int x, char c )
    {
        return FindUnmarkedInColumn( x, c ) != -1;
    }

    public int GetHighestColumn()
    {
        int maxX = -1;
        for( int x = 0; x < width; x++ )
        {
            if( maxX == -1
                    || GetColumnSize(x) > GetColumnSize(maxX) )
                maxX = x;
        }

        return maxX;
    }

    public int FindUnmarkedInColumn( int x, char c )
    {
        for( int y = 0; y < height; y++ )
        {
            if( !grid[x,y].marked
                    && System.Char.ToUpper(grid[x,y].c) == System.Char.ToUpper(c) )
                return y;
        }
        return -1;
    }

    public void Mark( int x, int y, bool highlight )
    {
        grid[x,y].marked = highlight;
    }

    public void ClearHighlights()
    {
        for( int x = 0; x < width; x++ )
        for( int y = 0; y < height; y++ )
        {
            grid[x,y].marked = false;
        }
    }

    public int GetHighestColumnContaining(char c)
    {
        int maxX = -1;
        for( int x = 0; x < width; x++ )
        {
            if( ColumnContainsUnmarked(x, c)
                    && (maxX == -1 || GetColumnSize(x) > GetColumnSize(maxX) ) )
                maxX = x;
        }

        return maxX;
    }

    public bool Contains( char c )
    {
        for( int x = 0; x < width; x++ )
        for( int y = 0; y < height; y++ )
        {
            if( System.Char.ToUpper( grid[x,y].c ) == System.Char.ToUpper(c) )
                return true;
        }

        return false;

    }
}
